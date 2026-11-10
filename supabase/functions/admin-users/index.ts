import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLE_PATTERN = /^[a-z][a-z0-9-]{1,31}$/;
const UUID_PATTERN = /^[0-9a-f-]{36}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: "unauthorized" }, 401);

    const { data: caller } = await userClient
      .from("allowed_staff")
      .select("is_admin")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!caller?.is_admin) return json({ error: "forbidden" }, 403);

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json();

    if (body.action === "create") {
      const email = typeof body.email === "string" ? body.email.trim() : "";
      const password = typeof body.password === "string" ? body.password : "";
      const role = typeof body.role === "string" ? body.role : "";
      if (!EMAIL_PATTERN.test(email)) return json({ error: "invalid_email" }, 400);
      if (password.length < 8) return json({ error: "weak_password" }, 400);
      if (!ROLE_PATTERN.test(role)) return json({ error: "invalid_role" }, 400);

      const { data: roleRow } = await admin.from("staff_roles").select("name").eq("name", role).maybeSingle();
      if (!roleRow) return json({ error: "unknown_role" }, 400);

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createError || !created.user) {
        const exists = createError?.message?.toLowerCase().includes("already");
        return json({ error: exists ? "email_exists" : "create_failed" }, exists ? 409 : 500);
      }

      const { error: staffError } = await admin
        .from("allowed_staff")
        .insert({ user_id: created.user.id, role, is_admin: false });
      if (staffError) {
        await admin.auth.admin.deleteUser(created.user.id);
        return json({ error: "create_failed" }, 500);
      }
      return json({ ok: true, user_id: created.user.id });
    }

    if (body.action === "reset-password") {
      const userId = typeof body.user_id === "string" ? body.user_id : "";
      const password = typeof body.password === "string" ? body.password : "";
      if (!UUID_PATTERN.test(userId)) return json({ error: "invalid_user" }, 400);
      if (password.length < 8) return json({ error: "weak_password" }, 400);

      const { error: updateError } = await admin.auth.admin.updateUserById(userId, { password });
      if (updateError) return json({ error: "reset_failed" }, 500);
      return json({ ok: true });
    }

    return json({ error: "unknown_action" }, 400);
  } catch {
    return json({ error: "server_error" }, 500);
  }
});

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

const HOST_PATTERN = /^[a-z0-9.-]+(:\d{1,5})?$/i;
const HEALTH_TIMEOUT_MS = 8000;

async function checkVcenter(host: string, username: string, password: string) {
  const base = `https://${host}`;
  const timeout = () => AbortSignal.timeout(HEALTH_TIMEOUT_MS);
  try {
    const sessionRes = await fetch(`${base}/api/session`, {
      method: "POST",
      headers: { Authorization: `Basic ${btoa(`${username}:${password}`)}` },
      signal: timeout(),
    });
    if (sessionRes.status === 401 || sessionRes.status === 403) {
      return { status: "error" as const, message: "نام کاربری یا رمز عبور اشتباه است." };
    }
    if (!sessionRes.ok) {
      return { status: "error" as const, message: `vCenter پاسخ خطا داد (کد ${sessionRes.status}).` };
    }
    const sessionId = (await sessionRes.json()) as string;

    const versionRes = await fetch(`${base}/api/appliance/system/version`, {
      headers: { "vmware-api-session-id": sessionId },
      signal: timeout(),
    });
    let version = "";
    if (versionRes.ok) {
      const info = (await versionRes.json()) as { version?: string };
      version = info.version ?? "";
    }

    await fetch(`${base}/api/session`, {
      method: "DELETE",
      headers: { "vmware-api-session-id": sessionId },
      signal: timeout(),
    }).catch(() => undefined);

    return {
      status: "ok" as const,
      message: version ? `اتصال برقرار است. نسخه: ${version}` : "اتصال برقرار است.",
    };
  } catch {
    return { status: "error" as const, message: "اتصال به سرور vCenter برقرار نشد (شبکه یا گواهی TLS)." };
  }
}

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

    if (body.action === "save") {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const host = typeof body.host === "string" ? body.host.trim().toLowerCase() : "";
      const username = typeof body.username === "string" ? body.username.trim() : "";
      const password = typeof body.password === "string" ? body.password : "";
      if (!name || name.length > 80) return json({ error: "invalid_name" }, 400);
      if (!HOST_PATTERN.test(host)) return json({ error: "invalid_host" }, 400);
      if (!username || !password) return json({ error: "missing_credentials" }, 400);

      const { error } = await admin.from("vcenter_connections").insert({ name, host, username, password });
      if (error) return json({ error: "save_failed" }, 500);
      return json({ ok: true });
    }

    if (body.action === "check") {
      const id = typeof body.id === "string" ? body.id : "";
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "invalid_connection" }, 400);

      const { data: conn, error: readError } = await admin
        .from("vcenter_connections")
        .select("host, username, password")
        .eq("id", id)
        .maybeSingle();
      if (readError) return json({ error: "check_failed" }, 500);
      if (!conn) return json({ error: "not_found" }, 404);

      const result = await checkVcenter(conn.host, conn.username, conn.password);
      await admin
        .from("vcenter_connections")
        .update({ last_status: result.status, last_message: result.message, last_checked_at: new Date().toISOString() })
        .eq("id", id);

      return json({ ok: true, status: result.status, message: result.message });
    }

    return json({ error: "unknown_action" }, 400);
  } catch {
    return json({ error: "server_error" }, 500);
  }
});

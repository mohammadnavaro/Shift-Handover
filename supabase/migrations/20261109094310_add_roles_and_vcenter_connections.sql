/*
# Add staff roles, role-based reason writing, and vCenter connection records

1. New Tables
- `staff_roles`: named roles (name, label, can_write_reasons). Seeded with operator, supervisor and viewer.
- `vcenter_connections`: vCenter API connection records (name, host, username, last health check result). The password is stored here but is never readable by browser users.

2. Modified Tables
- `allowed_staff`: new column `role` (defaults to operator) referencing `staff_roles`.

3. Security
- `staff_roles`: staff can read roles; no client writes. Changes go through admin functions.
- `change_reasons`: the insert policy now requires the author's role to allow writing reasons (viewers cannot).
- `vcenter_connections`: RLS enabled. Admins can read non-secret columns only (the password column has no grant for browser users). Writes and health checks use server-side functions with the service role.
- `admin_list_accounts()` now also returns each account's role. `admin_set_role` and `admin_upsert_role` are new admin-only functions.

4. Notes
- Existing staff are assigned the operator role, which keeps their current ability to write reasons.
*/

CREATE TABLE IF NOT EXISTS staff_roles (
  name text PRIMARY KEY CHECK (name ~ '^[a-z][a-z0-9-]{1,31}$'),
  label text NOT NULL CHECK (char_length(label) BETWEEN 1 AND 60),
  can_write_reasons boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE staff_roles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON staff_roles FROM anon, authenticated;
GRANT SELECT ON staff_roles TO authenticated;

DROP POLICY IF EXISTS "staff_select_roles" ON staff_roles;
CREATE POLICY "staff_select_roles" ON staff_roles FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM allowed_staff s WHERE s.user_id = auth.uid()));

INSERT INTO staff_roles (name, label, can_write_reasons) VALUES
  ('operator', 'اپراتور', true),
  ('supervisor', 'سرپرست شیفت', true),
  ('viewer', 'خواننده', false)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE allowed_staff ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'operator' REFERENCES staff_roles(name);

DROP POLICY IF EXISTS "staff_insert_own_reasons" ON change_reasons;
CREATE POLICY "staff_insert_own_reasons" ON change_reasons FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND author_email = (auth.jwt() ->> 'email')
    AND EXISTS (
      SELECT 1 FROM allowed_staff s
      JOIN staff_roles r ON r.name = s.role
      WHERE s.user_id = auth.uid() AND r.can_write_reasons
    )
  );

CREATE TABLE IF NOT EXISTS vcenter_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  host text NOT NULL CHECK (char_length(host) BETWEEN 1 AND 255),
  username text NOT NULL CHECK (char_length(username) BETWEEN 1 AND 255),
  password text NOT NULL,
  last_checked_at timestamptz,
  last_status text CHECK (last_status IN ('ok', 'error')),
  last_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vcenter_connections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON vcenter_connections FROM anon, authenticated;
GRANT SELECT (id, name, host, username, last_checked_at, last_status, last_message, created_at)
  ON vcenter_connections TO authenticated;
GRANT ALL ON vcenter_connections TO service_role;

DROP POLICY IF EXISTS "admin_select_vcenter_connections" ON vcenter_connections;
CREATE POLICY "admin_select_vcenter_connections" ON vcenter_connections FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM allowed_staff s WHERE s.user_id = auth.uid() AND s.is_admin));

DROP FUNCTION IF EXISTS public.admin_list_accounts();
CREATE FUNCTION public.admin_list_accounts()
RETURNS TABLE (user_id uuid, email text, created_at timestamptz, is_staff boolean, is_admin boolean, role text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT u.id, u.email::text, u.created_at, (s.user_id IS NOT NULL), COALESCE(s.is_admin, false), s.role
    FROM auth.users u
    LEFT JOIN allowed_staff s ON s.user_id = u.id
    ORDER BY u.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_role(target uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  UPDATE allowed_staff SET role = new_role WHERE user_id = target;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'account is not staff' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_role(role_name text, role_label text, writes_reasons boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  INSERT INTO staff_roles (name, label, can_write_reasons) VALUES (role_name, role_label, writes_reasons)
  ON CONFLICT (name) DO UPDATE SET label = EXCLUDED.label, can_write_reasons = EXCLUDED.can_write_reasons;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_accounts() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_role(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_role(text, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_accounts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_role(text, text, boolean) TO authenticated;

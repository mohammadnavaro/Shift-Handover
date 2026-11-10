/*
# Add admin role and account management functions

1. Modified Tables
- `allowed_staff`: new column `is_admin` (boolean, default false). Admins can manage account access.

2. New Functions (all SECURITY DEFINER, callable only by signed-in users; each checks the caller is an admin)
- `is_admin()`: true when the caller has an admin row in `allowed_staff`. Not callable by clients directly.
- `admin_list_accounts()`: lists every sign-up with its email, creation time, staff status and admin status.
- `admin_set_staff(target, enabled)`: grants or revokes access. Admins cannot revoke their own access.
- `admin_set_admin(target, enabled)`: grants or removes the admin role for an existing staff member. Admins cannot remove their own admin role.

3. Security
- Clients get no direct INSERT, UPDATE or DELETE on `allowed_staff`; all changes go through the functions above.
- EXECUTE is revoked from PUBLIC and anon on every function; only authenticated users may call the admin functions, and each one re-checks admin status.

4. Notes
- Existing rows keep their access; they start as non-admin.
- Only the database owner can promote the first admin.
*/

ALTER TABLE allowed_staff ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM allowed_staff s WHERE s.user_id = auth.uid() AND s.is_admin
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_list_accounts()
RETURNS TABLE (user_id uuid, email text, created_at timestamptz, is_staff boolean, is_admin boolean)
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
    SELECT u.id, u.email::text, u.created_at, (s.user_id IS NOT NULL), COALESCE(s.is_admin, false)
    FROM auth.users u
    LEFT JOIN allowed_staff s ON s.user_id = u.id
    ORDER BY u.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_staff(target uuid, enabled boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF target = auth.uid() AND NOT enabled THEN
    RAISE EXCEPTION 'cannot revoke own access' USING ERRCODE = '42501';
  END IF;
  IF enabled THEN
    INSERT INTO allowed_staff (user_id) VALUES (target) ON CONFLICT (user_id) DO NOTHING;
  ELSE
    DELETE FROM allowed_staff WHERE user_id = target;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_admin(target uuid, enabled boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF target = auth.uid() AND NOT enabled THEN
    RAISE EXCEPTION 'cannot remove own admin role' USING ERRCODE = '42501';
  END IF;
  UPDATE allowed_staff SET is_admin = enabled WHERE user_id = target;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'account is not staff' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_list_accounts() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_staff(uuid, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_admin(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_accounts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_staff(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_admin(uuid, boolean) TO authenticated;

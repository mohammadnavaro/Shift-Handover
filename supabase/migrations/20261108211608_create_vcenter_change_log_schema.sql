/*
# Create vCenter change log schema

Adds the tables behind the vCenter change timeline: collected events, append-only
reasons written by staff, and an allowlist of staff accounts allowed to read and write.

1. New Tables
- `vcenter_events`: one row per vCenter Task/Event. `external_key` is unique so the
  collector can re-send an item without creating a duplicate. Written by the collector
  (service role) only; staff can read but never write.
- `change_reasons`: append-only reason versions. Each edit inserts a new row, so the
  previous text and its author/time are always kept. Rows are never updated or deleted.
- `allowed_staff`: user accounts that may see the log and write reasons. Each row maps
  an authenticated account to staff access. Managed by the database owner only.

2. Seed data
- Ten sample events from the design prototype are inserted with fixed keys so the
  timeline has content. They are idempotent (ON CONFLICT on `external_key`) and should be
  removed once the real collector runs.

3. Security
- RLS is enabled on all three tables.
- Staff (rows in `allowed_staff`) can SELECT events and reasons.
- Staff can INSERT reasons only as themselves (`author_id = auth.uid()`), with the
  author email taken from the session, and only for an existing event.
- No UPDATE or DELETE grants or policies exist on `change_reasons` or `vcenter_events`,
  so reasons and events cannot be altered or removed through the app.
- A signed-in user can read only their own `allowed_staff` row, which lets the app
  detect whether the account has access.

4. Important notes
- Accounts that sign up but are not in `allowed_staff` see no events or reasons.
- Event times are stored as timestamps with time zone; shifts are computed in the app
  using the Asia/Tehran zone.
*/

CREATE TABLE IF NOT EXISTS vcenter_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key text NOT NULL UNIQUE,
  occurred_at timestamptz NOT NULL,
  user_name text NOT NULL DEFAULT '',
  user_type text NOT NULL DEFAULT 'human',
  operation text NOT NULL DEFAULT '',
  object_name text NOT NULL DEFAULT '',
  result text NOT NULL DEFAULT '',
  summary text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vcenter_events_occurred_at_idx ON vcenter_events (occurred_at);

CREATE TABLE IF NOT EXISTS allowed_staff (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS change_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES vcenter_events(id),
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000),
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  author_email text NOT NULL DEFAULT (auth.jwt() ->> 'email'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS change_reasons_event_idx ON change_reasons (event_id, created_at);

ALTER TABLE vcenter_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowed_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_reasons ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON vcenter_events TO authenticated;
GRANT SELECT, INSERT ON vcenter_events TO service_role;
GRANT SELECT ON allowed_staff TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON allowed_staff TO service_role;
GRANT SELECT, INSERT ON change_reasons TO authenticated;
GRANT SELECT, INSERT ON change_reasons TO service_role;

DROP POLICY IF EXISTS "staff_select_events" ON vcenter_events;
CREATE POLICY "staff_select_events" ON vcenter_events FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM allowed_staff s WHERE s.user_id = auth.uid())
);

DROP POLICY IF EXISTS "self_select_staff_row" ON allowed_staff;
CREATE POLICY "self_select_staff_row" ON allowed_staff FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "staff_select_reasons" ON change_reasons;
CREATE POLICY "staff_select_reasons" ON change_reasons FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM allowed_staff s WHERE s.user_id = auth.uid())
);

DROP POLICY IF EXISTS "staff_insert_own_reasons" ON change_reasons;
CREATE POLICY "staff_insert_own_reasons" ON change_reasons FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND author_email = (auth.jwt() ->> 'email')
  AND EXISTS (SELECT 1 FROM allowed_staff s WHERE s.user_id = auth.uid())
);

INSERT INTO vcenter_events (external_key, occurred_at, user_name, user_type, operation, object_name, result, summary) VALUES
  ('sample-001', '2026-11-03T08:20:00+03:30', 'sample-user', 'human', 'reconfigure', 'vm12', 'success', 'vm12 reconfigured: memory 8 GB to 16 GB'),
  ('sample-002', '2026-11-03T15:40:00+03:30', 'sample-user', 'human', 'migrate', 'vm-web02', 'success', 'vm-web02 migrated from host 41 to host 44'),
  ('sample-003', '2026-11-03T22:05:00+03:30', 'sample-user', 'human', 'expand', 'ds-ssd-02', 'success', 'datastore ds-ssd-02 capacity expanded'),
  ('sample-004', '2026-11-04T01:30:00+03:30', 'sample-user', 'human', 'power-off', 'vm7', 'success', 'vm7 powered off'),
  ('sample-005', '2026-11-04T09:10:00+03:30', 'sample-user', 'human', 'permission', 'Prod-VMs', 'success', 'permission changed on folder Prod-VMs'),
  ('sample-006', '2026-11-04T13:55:00+03:30', 'sample-user', 'human', 'delete', 'vm-app05', 'success', 'vm-app05 deleted from inventory'),
  ('sample-007', '2026-11-04T19:42:00+03:30', 'sample-user', 'human', 'create', 'VLAN-120', 'success', 'portgroup VLAN-120 created on dvSwitch1'),
  ('sample-008', '2026-11-05T02:15:00+03:30', 'sample-user', 'human', 'snapshot-remove', 'vm3', 'success', 'snapshot removed, vm3'),
  ('sample-009', '2026-11-05T10:45:00+03:30', 'sample-user', 'human', 'maintenance', 'host 46', 'success', 'host 46 changed state to maintenance mode'),
  ('sample-010', '2026-11-05T12:21:00+03:30', 'sample-user', 'human', 'snapshot-create', 'vm3', 'success', 'create a new snapshot, vm3')
ON CONFLICT (external_key) DO NOTHING;

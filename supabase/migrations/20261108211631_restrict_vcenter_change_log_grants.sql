/*
# Restrict default table privileges on the vCenter change log

The project's default privileges grant anon and authenticated every verb on new public
tables. This migration removes them so only the verbs the app needs remain.

1. Security changes
- anon: no privileges on any of the three tables.
- authenticated: SELECT on vcenter_events, allowed_staff; SELECT and INSERT on change_reasons.
  No UPDATE or DELETE anywhere, so reasons and events stay append-only.
- service_role keeps the grants needed by the collector.
*/

REVOKE ALL ON vcenter_events FROM anon, authenticated;
REVOKE ALL ON allowed_staff FROM anon, authenticated;
REVOKE ALL ON change_reasons FROM anon, authenticated;

GRANT SELECT ON vcenter_events TO authenticated;
GRANT SELECT ON allowed_staff TO authenticated;
GRANT SELECT, INSERT ON change_reasons TO authenticated;

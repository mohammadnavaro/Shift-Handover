CREATE TABLE IF NOT EXISTS shift_closures (
  day_key date NOT NULL,
  kind text NOT NULL CHECK (kind IN ('day', 'night')),
  closed_at timestamptz NOT NULL DEFAULT now(),
  closed_by_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  closed_by_email text NOT NULL DEFAULT (auth.jwt() ->> 'email'),
  PRIMARY KEY (day_key, kind)
);

ALTER TABLE shift_closures ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON shift_closures TO authenticated;

DROP POLICY IF EXISTS "staff_select_shift_closures" ON shift_closures;
CREATE POLICY "staff_select_shift_closures" ON shift_closures FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM allowed_staff s WHERE s.user_id = auth.uid()));

DROP POLICY IF EXISTS "writer_close_ended_shift" ON shift_closures;
CREATE POLICY "writer_close_ended_shift" ON shift_closures FOR INSERT
TO authenticated
WITH CHECK (
  closed_by_id = auth.uid()
  AND closed_by_email = (auth.jwt() ->> 'email')
  AND EXISTS (
    SELECT 1 FROM allowed_staff s
    JOIN staff_roles r ON r.name = s.role
    WHERE s.user_id = auth.uid() AND r.can_write_reasons
  )
  AND now() >= (
    (day_key + CASE WHEN kind = 'night' THEN 1 ELSE 0 END)
    + CASE WHEN kind = 'day' THEN time '19:00' ELSE time '07:00' END
  ) AT TIME ZONE 'Asia/Tehran'
);

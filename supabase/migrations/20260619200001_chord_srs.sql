-- Spaced repetition state per student per chord (SM-2 algorithm).
-- One row per (student, chord); upserted after each quiz session.

CREATE TABLE chord_srs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chord_id TEXT NOT NULL,

  -- SM-2 fields
  repetitions SMALLINT NOT NULL DEFAULT 0,
  interval_days REAL NOT NULL DEFAULT 1,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_chord_srs UNIQUE (student_id, chord_id)
);

CREATE INDEX ix_chord_srs_student_due
  ON chord_srs (student_id, next_review_at);

ALTER TABLE chord_srs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own SRS state" ON chord_srs
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students insert own SRS state" ON chord_srs
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students update own SRS state" ON chord_srs
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "Staff read all SRS state" ON chord_srs
  FOR SELECT USING (is_admin_or_teacher());

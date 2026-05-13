-- Chord-recognition quiz attempts.
-- One row per question answered. The quiz UI submits a batch at the end of a session.

CREATE TABLE IF NOT EXISTS chord_quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    chord_id TEXT NOT NULL,                 -- key from CHORD_VOICINGS in lib/music-theory/chord-voicings.ts
    selected_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    response_time_ms INTEGER CHECK (response_time_ms IS NULL OR response_time_ms >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chord_quiz_attempts_student_created_idx
    ON chord_quiz_attempts (student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS chord_quiz_attempts_chord_idx
    ON chord_quiz_attempts (chord_id);

ALTER TABLE chord_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- A student can read their own attempts.
CREATE POLICY "Students can view their own chord quiz attempts" ON chord_quiz_attempts
    FOR SELECT USING (student_id = auth.uid());

-- A student can insert attempts only for themselves.
CREATE POLICY "Students can insert their own chord quiz attempts" ON chord_quiz_attempts
    FOR INSERT WITH CHECK (student_id = auth.uid());

-- Admins and teachers can read every attempt.
CREATE POLICY "Admins and teachers can view all chord quiz attempts" ON chord_quiz_attempts
    FOR SELECT USING (is_admin_or_teacher());

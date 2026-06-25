-- ============================================================================
-- ACADEMIA SEGUIDOR DE LUZ — TEACHER TOOLS & WORKFLOW EXTENSION
-- ============================================================================

-- 1. ADD NEW COLUMNS TO EXISTING TABLES
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS requires_manual_approval BOOLEAN DEFAULT TRUE;

ALTER TABLE public.user_activity_progress
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'not_submitted'
CHECK (approval_status IN ('not_submitted', 'pending', 'approved', 'rejected'));

-- 2. CREATE NEW TABLES FOR PARALELOS AND ATTENDANCE

CREATE TABLE IF NOT EXISTS public.paralelos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.class_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paralelo_id UUID NOT NULL REFERENCES public.paralelos(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_present BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- 3. UPDATE USER_PROFILE TO LINK TO PARALELO (Instead of text)
-- Currently `paralelo` in `user_profile` is a TEXT field. We will keep it as TEXT for now to not break existing data,
-- or we can link the `student_id` to a `paralelo_id`. 
-- Since the user said they will create the users in DB with the 'paralelo' name,
-- we'll just match the text `name` in `paralelos` with the text `paralelo` in `user_profile`.

-- 4. ROW LEVEL SECURITY

ALTER TABLE public.paralelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Paralelos: Teachers can manage their own, students can read if they belong to it
CREATE POLICY "teacher_manage_own_paralelos"
  ON public.paralelos FOR ALL
  TO authenticated
  USING (
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) IN ('teacher', 'admin')
  );

CREATE POLICY "student_read_paralelos"
  ON public.paralelos FOR SELECT
  TO authenticated
  USING (
    name = (SELECT paralelo FROM public.user_profile WHERE user_id = auth.uid())
  );

-- Class Sessions: Teachers manage, students read
CREATE POLICY "teacher_manage_sessions"
  ON public.class_sessions FOR ALL
  TO authenticated
  USING (
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) IN ('teacher', 'admin')
  );

CREATE POLICY "student_read_sessions"
  ON public.class_sessions FOR SELECT
  TO authenticated
  USING (
    paralelo_id IN (
      SELECT id FROM public.paralelos 
      WHERE name = (SELECT paralelo FROM public.user_profile WHERE user_id = auth.uid())
    )
  );

-- Attendance: Teachers manage, students read their own
CREATE POLICY "teacher_manage_attendance"
  ON public.attendance FOR ALL
  TO authenticated
  USING (
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) IN ('teacher', 'admin')
  );

CREATE POLICY "student_read_own_attendance"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- 5. GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.paralelos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;

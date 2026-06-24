-- ============================================================================
-- ACADEMIA SEGUIDOR DE LUZ — SUPABASE SCHEMA
-- Run this in your NEW Supabase project SQL Editor (one shot)
-- ============================================================================

-- ─── 1. USER PROFILES ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_profile (
    user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name   TEXT,
    paralelo    TEXT,        -- e.g. "A", "B", "Tarde"
    role        TEXT NOT NULL DEFAULT 'student'  -- 'student' | 'teacher' | 'admin' | 'guest'
                CHECK (role IN ('student', 'teacher', 'admin', 'guest')),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. ACTIVITIES (lessons catalog) ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.activities (
    id                          TEXT PRIMARY KEY,
    slug                        TEXT NOT NULL UNIQUE,
    module_id                   TEXT,
    title                       TEXT NOT NULL,
    description                 TEXT,
    order_index                 INTEGER NOT NULL DEFAULT 0,
    estimated_duration_minutes  INTEGER,
    is_required                 BOOLEAN DEFAULT TRUE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3. USER PROGRESS ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_activity_progress (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_id           TEXT NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    status                TEXT NOT NULL DEFAULT 'not_started'
                          CHECK (status IN ('not_started', 'in_progress', 'completed', 'failed')),
    started_at            TIMESTAMPTZ,
    completed_at          TIMESTAMPTZ,
    last_visited_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    progress_percentage   INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    time_spent_seconds    INTEGER DEFAULT 0,
    score                 INTEGER,
    max_score             INTEGER,
    attempts_count        INTEGER DEFAULT 0,
    notes                 TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, activity_id)
);

-- ─── 4. LESSON REFLECTIONS ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.lesson_reflections (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_slug   TEXT NOT NULL,
    question_key  TEXT NOT NULL,
    answer_text   TEXT NOT NULL,
    submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, lesson_slug, question_key)
);

-- ─── 5. LESSONS VISIBILITY ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.lessons_visibility (
    lesson_slug  TEXT PRIMARY KEY,
    is_visible   BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ─── 6. TRIGGERS ─────────────────────────────────────────────────────────────

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_profile (user_id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    'student'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync role → app_metadata (so middleware can read it securely from JWT)
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data =
    COALESCE(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_profile_role_update ON public.user_profile;
CREATE TRIGGER on_user_profile_role_update
  AFTER INSERT OR UPDATE OF role ON public.user_profile
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_role();

-- ─── 7. ROW LEVEL SECURITY ───────────────────────────────────────────────────

ALTER TABLE public.user_profile           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_reflections     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons_visibility     ENABLE ROW LEVEL SECURITY;

-- user_profile: own row
CREATE POLICY "student_view_own_profile"
  ON public.user_profile FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "student_update_own_profile"
  ON public.user_profile FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Teachers/admins can view all profiles
CREATE POLICY "teacher_view_all_profiles"
  ON public.user_profile FOR SELECT
  TO authenticated
  USING (
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid())
    IN ('teacher', 'admin')
  );

-- activities: public read
CREATE POLICY "public_read_activities"
  ON public.activities FOR SELECT
  USING (true);

-- user_activity_progress: own rows only (student)
CREATE POLICY "student_view_own_progress"
  ON public.user_activity_progress FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "student_insert_own_progress"
  ON public.user_activity_progress FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "student_update_own_progress"
  ON public.user_activity_progress FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Teachers can view all progress
CREATE POLICY "teacher_view_all_progress"
  ON public.user_activity_progress FOR SELECT
  TO authenticated
  USING (
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid())
    IN ('teacher', 'admin')
  );

-- lesson_reflections: own rows (students)
CREATE POLICY "student_manage_own_reflections"
  ON public.lesson_reflections FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "teacher_view_all_reflections"
  ON public.lesson_reflections FOR SELECT
  TO authenticated
  USING (
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid())
    IN ('teacher', 'admin')
  );

-- lessons_visibility: all authenticated can read, only teacher/admin can write
CREATE POLICY "authenticated_read_visibility"
  ON public.lessons_visibility FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "anon_read_visibility"
  ON public.lessons_visibility FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "teacher_manage_visibility"
  ON public.lessons_visibility FOR ALL
  TO authenticated
  USING (
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid())
    IN ('teacher', 'admin')
  )
  WITH CHECK (
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid())
    IN ('teacher', 'admin')
  );

-- ─── 8. GRANT API ACCESS ─────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE ON public.user_profile TO authenticated;
GRANT SELECT ON public.activities TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.user_activity_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.lesson_reflections TO authenticated;
GRANT SELECT ON public.lessons_visibility TO authenticated, anon;
GRANT INSERT, UPDATE ON public.lessons_visibility TO authenticated;

-- ─── 9. SEED: Activities (lessons catalog) ───────────────────────────────────

INSERT INTO public.activities (id, slug, module_id, title, description, order_index, estimated_duration_minutes) VALUES
('lesson-01-fundamentos-00-conceptos-previos', '01-fundamentos/00-conceptos-previos', '01-fundamentos', '¿Qué es el Arduino y la Robótica?', 'Conceptos previos y partes del Arduino Uno.', 0, 30),
('lesson-01-fundamentos-01-registro-tinkercad', '01-fundamentos/01-registro-tinkercad', '01-fundamentos', 'Registro en Tinkercad', 'Crear cuenta y entorno de simulación.', 1, 15),
('lesson-01-fundamentos-02-blink-tinkercad', '01-fundamentos/02-blink-tinkercad', '01-fundamentos', 'Blink en Tinkercad', 'Primer programa: parpadeo del LED.', 2, 20),
('lesson-01-fundamentos-03-led-externo-tinkercad', '01-fundamentos/03-led-externo-tinkercad', '01-fundamentos', 'LED Externo en Tinkercad', 'Controlar un LED externo con resistencia.', 3, 25),
('lesson-02-sensores-04-divisor-voltaje', '02-sensores/04-divisor-voltaje-tinkercad', '02-sensores', 'Divisor de Voltaje y LDR', 'Circuito divisor de voltaje con fotorresistencia.', 4, 25),
('lesson-02-sensores-05-fotoresistencia', '02-sensores/05-fotoresistencia-tinkercad', '02-sensores', 'Fotorresistencia y Umbral', 'Leer la fotorresistencia y aplicar un umbral.', 5, 20),
('lesson-02-sensores-06-crepuscular', '02-sensores/06-crepuscular-tinkercad', '02-sensores', 'Interruptor Crepuscular', 'LED que reacciona automáticamente a la luz.', 6, 20),
('lesson-03-motores-07-puente-h', '03-motores/07-puente-h-motores', '03-motores', 'Puente H y Motores DC', 'Control de motores con el módulo L298N.', 7, 30),
('lesson-03-motores-08-steamakersblocks', '03-motores/08-steamakersblocks', '03-motores', 'Programación con Bloques', 'Introducción a SteamMakers Blocks y Tinkercad.', 8, 25),
('lesson-04-armado-09-ensamblaje', '04-armado/09-ensamblaje-sensores', '04-armado', 'Ensamblaje y Sensores', 'Montar el robot y conectar los sensores físicos.', 9, 40),
('lesson-04-armado-10-seguidor-logica-1', '04-armado/10-seguidor-logica-1', '04-armado', 'Lógica del Seguidor I', 'Primeros pasos del algoritmo de seguimiento.', 10, 30),
('lesson-04-armado-11-seguidor-logica-2', '04-armado/11-seguidor-logica-2', '04-armado', 'Lógica del Seguidor II', 'Calibración y ajustes del robot.', 11, 30),
('lesson-04-armado-12-integracion-final', '04-armado/12-integracion-final', '04-armado', 'Integración Final', 'Ensamblaje y pruebas finales del robot completo.', 12, 45)
ON CONFLICT (id) DO NOTHING;

-- ─── 10. INITIALIZE VISIBILITY FOR ALL LESSONS ───────────────────────────────
-- All lessons visible by default; teacher can toggle from the portal

INSERT INTO public.lessons_visibility (lesson_slug, is_visible) VALUES
('01-fundamentos/00-conceptos-previos', true),
('01-fundamentos/01-registro-tinkercad', true),
('01-fundamentos/02-blink-tinkercad', true),
('01-fundamentos/03-led-externo-tinkercad', true),
('02-sensores/04-divisor-voltaje-tinkercad', false),
('02-sensores/05-fotoresistencia-tinkercad', false),
('02-sensores/06-crepuscular-tinkercad', false),
('03-motores/07-puente-h-motores', false),
('03-motores/08-steamakersblocks', false),
('04-armado/09-ensamblaje-sensores', false),
('04-armado/10-seguidor-logica-1', false),
('04-armado/11-seguidor-logica-2', false),
('04-armado/12-integracion-final', false)
ON CONFLICT (lesson_slug) DO NOTHING;

-- ─── DONE ────────────────────────────────────────────────────────────────────
-- After running this:
-- 1. Go to Authentication > Settings > Disable email confirmation
-- 2. Create your teacher user in Auth > Users, then run:
--    UPDATE public.user_profile SET role = 'teacher' WHERE user_id = '<your-uuid>';
-- 3. Copy Project URL and anon key → update astro.config.mjs

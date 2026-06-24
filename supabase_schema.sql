-- ============================================================================
-- SOCCER JR. SUPABASE SCHEMA
-- Run this in your Supabase SQL Editor to set up the database.
-- ============================================================================

-- 1. Create Tables
CREATE TABLE public.user_profile (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT,
    organization TEXT,
    role TEXT DEFAULT 'student',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE public.activity_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    icon TEXT,
    requires_completion BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE public.activities (
    id TEXT PRIMARY KEY,
    type_id TEXT NOT NULL REFERENCES public.activity_types(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    module_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    module_order INTEGER,
    estimated_duration_minutes INTEGER,
    points INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT TRUE,
    prerequisites TEXT, -- JSON array string
    metadata TEXT, -- JSON string
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_activity_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_id TEXT NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'not_started',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    progress_percentage INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    score INTEGER,
    max_score INTEGER,
    attempts_count INTEGER DEFAULT 0,
    metadata TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, activity_id) -- A user can only have one progress record per activity
);

-- 2. Trigger to automatically create a user_profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profile (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Row Level Security (RLS) Policies
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_progress ENABLE ROW LEVEL SECURITY;

-- user_profile: Users can view and update their own profile. Admins can view/update all.
CREATE POLICY "Users can view own profile" 
ON public.user_profile FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON public.user_profile FOR UPDATE 
USING (auth.uid() = user_id);

-- activity_types & activities: Everyone (even unauthenticated) can view, only admins can modify
CREATE POLICY "Public read access to activity types" 
ON public.activity_types FOR SELECT 
USING (true);

CREATE POLICY "Public read access to activities" 
ON public.activities FOR SELECT 
USING (true);

-- user_activity_progress: Users can only view and modify their own progress
CREATE POLICY "Users can view own progress" 
ON public.user_activity_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" 
ON public.user_activity_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" 
ON public.user_activity_progress FOR UPDATE 
USING (auth.uid() = user_id);

-- ============================================================================
-- INITIAL DATA (Optional)
-- Insert some default activity types
-- ============================================================================
INSERT INTO public.activity_types (id, name, display_name, icon) VALUES 
('type_lesson', 'lesson', 'Lección', '📖'),
('type_quiz', 'quiz', 'Cuestionario', '📝'),
('type_project', 'project', 'Proyecto', '🚀')
ON CONFLICT (id) DO NOTHING;

-- Insert lessons for Light-Following Robot
INSERT INTO public.activities (id, type_id, slug, module_id, title, description, order_index, module_order, estimated_duration_minutes) VALUES 
('lesson-01-fundamentos-01-blink', 'type_lesson', '01-fundamentos/01-blink', '01-fundamentos', 'El Primer Parpadeo (Blink)', 'Aprende a programar el parpadeo de un LED.', 1, 1, 15),
('lesson-01-fundamentos-02-led-externo', 'type_lesson', '01-fundamentos/02-led-externo', '01-fundamentos', 'Conectando un LED Externo', 'Controla un LED externo en la placa.', 2, 2, 20),
('lesson-02-sensores-03-divisor-voltaje', 'type_lesson', '02-sensores/03-divisor-voltaje', '02-sensores', 'El Divisor de Voltaje y la Fotorresistencia', 'Entiende cómo leer la luz con una fotorresistencia.', 3, 1, 25),
('lesson-02-sensores-04-control-led-ldr', 'type_lesson', '02-sensores/04-control-led-ldr', '02-sensores', 'Controlando el LED con Luz', 'Haz que el LED reaccione a la luz ambiental.', 4, 2, 20),
('lesson-03-comunicacion-05-monitor-serie', 'type_lesson', '03-comunicacion/05-monitor-serie', '03-comunicacion', 'Viendo los Datos (Monitor Serie)', 'Visualiza los valores de la fotorresistencia.', 5, 1, 15),
('lesson-03-comunicacion-06-analisis-ruido', 'type_lesson', '03-comunicacion/06-analisis-ruido', '03-comunicacion', 'Analizando el Ruido', 'Aprende a promediar lecturas para mayor estabilidad.', 6, 2, 25),
('lesson-04-seguidor-luz-07-seguidor-completo', 'type_lesson', '04-seguidor-luz/07-seguidor-completo', '04-seguidor-luz', 'Ensamblando el Seguidor de Luz', 'Une todo para crear el robot que sigue la luz.', 7, 1, 40)
ON CONFLICT (id) DO NOTHING;

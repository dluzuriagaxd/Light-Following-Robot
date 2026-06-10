-- Función para sincronizar el rol de user_profile hacia auth.users (app_metadata)
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar el app_metadata de auth.users con el nuevo rol
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar el trigger si ya existe para evitar errores
DROP TRIGGER IF EXISTS on_user_profile_role_update ON public.user_profile;

-- Crear el trigger que se ejecuta cada vez que el rol cambia o se inserta
CREATE TRIGGER on_user_profile_role_update
AFTER INSERT OR UPDATE OF role ON public.user_profile
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role();

-- Opcional: Script para rellenar los roles de los usuarios existentes
-- Ejecutar esto una vez para asegurar que los usuarios actuales tengan su rol en app_metadata
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN SELECT user_id, role FROM public.user_profile LOOP
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', profile_record.role)
    WHERE id = profile_record.user_id;
  END LOOP;
END;
$$;

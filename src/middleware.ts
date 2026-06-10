import { defineMiddleware } from "astro:middleware";
import { getServerClient } from "./lib/supabase";

export const onRequest = defineMiddleware(async (context, next) => {
    const maintenance = import.meta.env.PUBLIC_MAINTENANCE_MODE === 'true';

    // 1. Definimos qué rutas queremos proteger
    const isProtectedRoute = context.url.pathname.startsWith("/curso") ||
        context.url.pathname.startsWith("/telemetria") ||
        context.url.pathname.startsWith("/simulador");

    const supabase = getServerClient(context);

    // Para validación de seguridad en el servidor usamos getUser()
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // Inyectar supabase y user en locals para que otras páginas los usen fácilmente
    context.locals.supabase = supabase;
    // (Opcional) si otras páginas aún usan locals.session, podemos obtenerlo
    const { data: { session } } = await supabase.auth.getSession();
    context.locals.session = session;

    // 2. Si es una ruta protegida, verificamos el usuario
    if (isProtectedRoute) {
        console.log(`[Middleware] Checking access to ${context.url.pathname}`);
        console.log(`[Middleware] User present: ${!!user}`);

        // Si no existe el usuario (o el token es inválido), lo mandamos al login
        if (!user || userError) {
            console.log(`[Middleware] Access denied - redirecting to /login`);
            return context.redirect("/login");
        }

        // Si estamos en modo mantenimiento, verificar rol de admin desde app_metadata
        if (maintenance) {
            const role = user.app_metadata?.role;
            console.log(`[Middleware] User role from claims: ${role}`);

            // Si no es admin, denegar acceso sin hacer consultas a la BD
            if (role !== 'admin') {
                console.log(`[Middleware] Maintenance mode: Access denied for non-admin`);
                return context.redirect("/");
            }
        }
    }

    // Si todo está bien o la ruta es pública, dejamos pasar
    return next();
});
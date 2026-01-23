// CRITICAL: Must be first - Polyfill MessageChannel for React 19 and better-auth
if (typeof MessageChannel === 'undefined') {
    // @ts-ignore
    globalThis.MessageChannel = class MessageChannel {
        port1 = { postMessage: () => { }, onmessage: null };
        port2 = { postMessage: () => { }, onmessage: null };
    };
}

import { defineMiddleware } from "astro:middleware";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "./db/schema";

export const onRequest = defineMiddleware(async (context, next) => {
    const maintenance = import.meta.env.PUBLIC_MAINTENANCE_MODE === 'true';

    // 1. Definimos qué rutas queremos proteger
    const isProtectedRoute = context.url.pathname.startsWith("/curso") ||
        context.url.pathname.startsWith("/telemetria");

    // 2. Si es una ruta protegida, revisamos la "Session Cookie"
    if (isProtectedRoute) {
        // Buscamos la cookie que crea Better Auth
        const sessionCookie = context.cookies.get("better-auth.session_token");

        console.log(`[Middleware] Checking access to ${context.url.pathname}`);
        console.log(`[Middleware] Session Cookie present: ${!!sessionCookie?.value}`);

        // Si no existe la cookie, lo mandamos al login
        if (!sessionCookie) {
            console.log(`[Middleware] Access denied - redirecting to /login`);
            return context.redirect("/login");
        }

        // Si estamos en modo mantenimiento, verificar rol de admin
        if (maintenance) {
            try {
                const locals = context.locals as any;
                const env = locals.runtime?.env || locals.env;

                if (env?.DB) {
                    const db = drizzle(env.DB, { schema });

                    // Buscar la sesión y el usuario
                    const session = await db
                        .select()
                        .from(schema.session)
                        .where(eq(schema.session.token, sessionCookie.value))
                        .get();

                    if (session) {
                        const user = await db
                            .select()
                            .from(schema.user)
                            .where(eq(schema.user.id, session.userId))
                            .get();

                        console.log(`[Middleware] User role: ${user?.role}`);

                        // Si no es admin, denegar acceso
                        if (user?.role !== 'admin') {
                            console.log(`[Middleware] Maintenance mode: Access denied for non-admin`);
                            return context.redirect("/");
                        }
                    }
                }
            } catch (error) {
                console.error("[Middleware] Error checking user role:", error);
                return context.redirect("/login");
            }
        }
    }

    // Si todo está bien o la ruta es pública (como el Index), dejamos pasar
    return next();
});
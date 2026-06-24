import { defineMiddleware } from "astro:middleware";
import { getServerClient } from "./lib/supabase";

// Routes accessible to guests (no auth required)
const PUBLIC_ROUTES = [
    "/",
    "/login",
    "/register",
    "/simulador",
    "/materiales",
    "/en-construccion",
];

// Routes that require teacher or admin role
const TEACHER_ROUTES = ["/docente"];

export const onRequest = defineMiddleware(async (context, next) => {
    const supabase = getServerClient(context);
    context.locals.supabase = supabase;

    // Use getUser() for server-side auth (secure, not getSession)
    const { data: { user }, error } = await supabase.auth.getUser();

    const session = user ? { user } : null;
    context.locals.session = session as any;

    const role: string = user?.app_metadata?.role ?? "guest";
    context.locals.isAdmin = role === "admin";
    
    // Attach user info to locals
    (context.locals as any).user = user;
    (context.locals as any).role = role;

    const pathname = context.url.pathname;

    // Allow API routes to handle their own auth
    if (pathname.startsWith("/api/")) {
        return next();
    }

    // Check if route is public — allow lesson menu browsing without login
    // but the slug content pages require auth
    const isPublicRoute = PUBLIC_ROUTES.some(route => 
        pathname === route || pathname.startsWith(route + "/")
    );

    // Lesson index browsing allowed, but actual lesson content requires login
    // /curso is allowed (shows lesson list), /curso/xx-... requires auth
    const isCourseRoot = pathname === "/curso";
    const isCourseContent = pathname.startsWith("/curso/") && pathname !== "/curso";

    if (isCourseContent && !user) {
        // Guest trying to access lesson content → redirect to login
        return context.redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
    }

    if (!isPublicRoute && !isCourseRoot && !user) {
        return context.redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
    }

    // Teacher-only routes
    if (TEACHER_ROUTES.some(r => pathname.startsWith(r))) {
        if (role !== "teacher" && role !== "admin") {
            return context.redirect("/login");
        }
    }

    return next();
});
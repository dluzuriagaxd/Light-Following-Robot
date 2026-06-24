import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
    // Set locals to mock/empty values to prevent crashes in downstream code
    context.locals.supabase = null as any;
    context.locals.session = null;
    context.locals.isAdmin = true; // Set to true by default to allow full admin views if needed

    // Allow all requests to proceed directly without authentication checks or redirects
    return next();
});
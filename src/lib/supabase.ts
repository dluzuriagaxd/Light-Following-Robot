import { createServerClient, parseCookieHeader, createBrowserClient } from '@supabase/ssr'
import type { APIContext } from 'astro'

// Client used in React components (Browser)
export const getBrowserClient = () => {
    return createBrowserClient(
        import.meta.env.PUBLIC_SUPABASE_URL,
        import.meta.env.PUBLIC_SUPABASE_ANON_KEY
    )
}

// Client used in Astro components and API endpoints (SSR)
export const getServerClient = (context: APIContext) => {
    // En Cloudflare, las variables de entorno pueden inyectarse en runtime
    const cfEnv = context.locals?.runtime?.env || {};
    
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || cfEnv.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || cfEnv.PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn("Supabase URL or Anon Key is missing in environment variables");
    }

    return createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return parseCookieHeader(context.request.headers.get('Cookie') ?? '')
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        // Astro cookies.set handles stringifying the options
                        context.cookies.set(name, value, options)
                    })
                },
            },
        }
    )
}

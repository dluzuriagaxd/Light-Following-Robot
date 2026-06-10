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
    return createServerClient(
        import.meta.env.PUBLIC_SUPABASE_URL,
        import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
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

import { createServerClient, parseCookieHeader, createBrowserClient } from '@supabase/ssr'
import type { APIContext } from 'astro'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from 'astro:env/client'

// Client used in React components (Browser)
export const getBrowserClient = () => {
    return createBrowserClient(
        PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_ANON_KEY
    )
}

// Client used in Astro components and API endpoints (SSR)
export const getServerClient = (context: APIContext) => {
    return createServerClient(
        PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return parseCookieHeader(context.request.headers.get('Cookie') ?? '').map(
                        ({ name, value }) => ({ name, value: value ?? '' })
                    )
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

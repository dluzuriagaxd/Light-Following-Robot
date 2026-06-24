/// <reference types="astro/client" />

declare namespace App {
    interface Locals {
        env: Env;
        cf: import("@cloudflare/workers-types").CfProperties;
        ctx: import("@cloudflare/workers-types").ExecutionContext;
        runtime: import("@astrojs/cloudflare").Runtime<Env>;
        isAdmin?: boolean;
        supabase: import("@supabase/supabase-js").SupabaseClient;
        session: { user: import("@supabase/supabase-js").User } | null;
        user: import("@supabase/supabase-js").User | null;
        role: "student" | "teacher" | "admin" | "guest";
    }
}

interface Env {}
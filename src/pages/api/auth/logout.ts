import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ locals, redirect }) => {
    const { supabase } = locals;
    await supabase.auth.signOut();
    return redirect("/login");
};

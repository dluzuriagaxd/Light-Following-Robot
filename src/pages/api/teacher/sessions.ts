import type { APIRoute } from "astro";

export const prerender = false;

function requireTeacher(locals: any) {
    const role = locals.role;
    return role === "teacher" || role === "admin";
}

// GET /api/teacher/sessions?paralelo_id=...
export const GET: APIRoute = async ({ locals, url }) => {
    if (!requireTeacher(locals)) return new Response("No autorizado", { status: 403 });

    const { supabase } = locals as any;
    const paraleloId = url.searchParams.get("paralelo_id");

    let query = supabase.from("class_sessions").select("*").order("session_date");
    if (paraleloId) {
        query = query.eq("paralelo_id", paraleloId);
    }

    const { data, error } = await query;
    if (error) return new Response(error.message, { status: 500 });

    return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
};

// POST /api/teacher/sessions
export const POST: APIRoute = async ({ request, locals }) => {
    if (!requireTeacher(locals)) return new Response("No autorizado", { status: 403 });

    const { supabase } = locals as any;
    const body = await request.json();
    const { paralelo_id, session_date, description } = body;

    if (!paralelo_id || !session_date) return new Response("Missing fields", { status: 400 });

    const { data, error } = await supabase
        .from("class_sessions")
        .insert({ paralelo_id, session_date, description })
        .select()
        .single();

    if (error) return new Response(error.message, { status: 500 });

    return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
};

// DELETE /api/teacher/sessions?id=...
export const DELETE: APIRoute = async ({ url, locals }) => {
    if (!requireTeacher(locals)) return new Response("No autorizado", { status: 403 });

    const { supabase } = locals as any;
    const id = url.searchParams.get("id");

    if (!id) return new Response("Missing id", { status: 400 });

    const { error } = await supabase.from("class_sessions").delete().eq("id", id);
    if (error) return new Response(error.message, { status: 500 });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
};

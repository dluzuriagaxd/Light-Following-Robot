import type { APIRoute } from "astro";

export const prerender = false;

function requireTeacher(locals: any) {
    const role = locals.role;
    return role === "teacher" || role === "admin";
}

// GET /api/teacher/paralelos
// GET /api/teacher/paralelos?id=...
export const GET: APIRoute = async ({ locals, url }) => {
    if (!requireTeacher(locals)) return new Response("No autorizado", { status: 403 });

    const { supabase, user } = locals as any;
    const id = url.searchParams.get("id");

    let query = supabase.from("paralelos").select("*").order("name");
    
    // Si es profesor, solo ver sus paralelos (o todos si es admin, pero dejémoslo que vea sus propios o la RLS lo hará)
    // Actually RLS for teacher_manage_own_paralelos allows them to manage ALL or only their own?
    // In schema: USING (role IN ('teacher', 'admin')). So they can see all.
    // If we want to filter by teacher, we can add eq('teacher_id', user.id).

    if (id) {
        query = query.eq("id", id).single();
    }

    const { data, error } = await query;

    if (error) return new Response(error.message, { status: 500 });

    return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
};

// POST /api/teacher/paralelos
export const POST: APIRoute = async ({ request, locals }) => {
    if (!requireTeacher(locals)) return new Response("No autorizado", { status: 403 });

    const { supabase, user } = locals as any;
    const body = await request.json();

    const { name, start_date } = body;
    if (!name || !start_date) return new Response("Missing fields", { status: 400 });

    const { data, error } = await supabase
        .from("paralelos")
        .insert({ name, start_date, teacher_id: user.id })
        .select()
        .single();

    if (error) return new Response(error.message, { status: 500 });

    return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
};

// PUT /api/teacher/paralelos
export const PUT: APIRoute = async ({ request, locals }) => {
    if (!requireTeacher(locals)) return new Response("No autorizado", { status: 403 });

    const { supabase } = locals as any;
    const body = await request.json();
    const { id, name, start_date } = body;

    if (!id) return new Response("Missing id", { status: 400 });

    const updates: any = {};
    if (name) updates.name = name;
    if (start_date) updates.start_date = start_date;

    const { data, error } = await supabase
        .from("paralelos")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) return new Response(error.message, { status: 500 });
    return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
};

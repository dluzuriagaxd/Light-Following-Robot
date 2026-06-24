import type { APIRoute } from "astro";

export const prerender = false;

function requireTeacher(locals: any) {
    const role = locals.role;
    return role === "teacher" || role === "admin";
}

// GET /api/teacher/lessons-visibility — get all lessons visibility settings
export const GET: APIRoute = async ({ locals }) => {
    if (!requireTeacher(locals)) {
        return new Response(JSON.stringify({ error: "No autorizado" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { supabase } = locals;
    const { data, error } = await supabase
        .from("lessons_visibility")
        .select("lesson_slug, is_visible, updated_at, updated_by")
        .order("lesson_slug");

    if (error) {
        return new Response(JSON.stringify({ error: "Error al obtener visibilidad" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ lessons: data ?? [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
};

// POST /api/teacher/lessons-visibility — toggle lesson visibility
export const POST: APIRoute = async ({ locals, request }) => {
    if (!requireTeacher(locals)) {
        return new Response(JSON.stringify({ error: "No autorizado" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { supabase, user } = locals as any;
    let body: any;
    try {
        body = await request.json();
    } catch {
        return new Response(JSON.stringify({ error: "JSON inválido" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { lesson_slug, is_visible } = body;
    if (!lesson_slug || typeof is_visible !== "boolean") {
        return new Response(JSON.stringify({ error: "Datos inválidos" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { error } = await supabase
        .from("lessons_visibility")
        .upsert(
            {
                lesson_slug,
                is_visible,
                updated_at: new Date().toISOString(),
                updated_by: user?.id ?? null,
            },
            { onConflict: "lesson_slug" }
        );

    if (error) {
        return new Response(JSON.stringify({ error: "Error al actualizar" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ success: true, lesson_slug, is_visible }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
};

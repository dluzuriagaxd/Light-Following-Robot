import type { APIRoute } from "astro";

export const prerender = false;

function requireTeacher(locals: any) {
    const role = locals.role;
    return role === "teacher" || role === "admin";
}

// GET /api/teacher/attendance?session_id=...
export const GET: APIRoute = async ({ locals, url }) => {
    if (!requireTeacher(locals)) return new Response("No autorizado", { status: 403 });

    const { supabase } = locals as any;
    const sessionId = url.searchParams.get("session_id");

    if (!sessionId) return new Response("Missing session_id", { status: 400 });

    const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("session_id", sessionId);

    if (error) return new Response(error.message, { status: 500 });

    return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
};

// POST /api/teacher/attendance
// Body: { session_id: "...", student_id: "...", is_present: boolean }
export const POST: APIRoute = async ({ request, locals }) => {
    if (!requireTeacher(locals)) return new Response("No autorizado", { status: 403 });

    const { supabase } = locals as any;
    const body = await request.json();
    const { session_id, student_id, is_present } = body;

    if (!session_id || !student_id || typeof is_present !== "boolean") {
        return new Response("Missing fields", { status: 400 });
    }

    const { data, error } = await supabase
        .from("attendance")
        .upsert({ session_id, student_id, is_present }, { onConflict: 'session_id,student_id' })
        .select()
        .single();

    if (error) return new Response(error.message, { status: 500 });

    return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
};

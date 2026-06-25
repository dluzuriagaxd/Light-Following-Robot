import type { APIRoute } from "astro";

export const prerender = false;

function requireTeacher(locals: any) {
    const role = locals.role;
    return role === "teacher" || role === "admin";
}

// POST /api/teacher/approve-activity
// Body: { user_id: string, activity_id: string, status: "approved" | "rejected" }
export const POST: APIRoute = async ({ request, locals }) => {
    if (!requireTeacher(locals)) {
        return new Response(JSON.stringify({ error: "No autorizado" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { supabase } = locals as any;
    const body = await request.json();
    const { user_id, activity_id, status, feedback } = body;

    if (!user_id || !activity_id || !status) {
        return new Response(JSON.stringify({ error: "Datos incompletos" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    if (!["approved", "rejected", "pending"].includes(status)) {
        return new Response(JSON.stringify({ error: "Estado inválido" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const payload: any = { approval_status: status };
    if (feedback !== undefined) {
        payload.teacher_feedback = feedback;
    }

    const { error } = await supabase
        .from("user_activity_progress")
        .update(payload)
        .eq("user_id", user_id)
        .eq("activity_id", activity_id);

    if (error) {
        return new Response(JSON.stringify({ error: "Error al actualizar estado" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
};

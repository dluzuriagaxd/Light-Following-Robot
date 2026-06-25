import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ locals, request }) => {
    const { supabase, user } = locals as any;

    if (!user) {
        return new Response(JSON.stringify({ error: "No autenticado" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    let body: any;
    try {
        body = await request.json();
    } catch {
        return new Response(JSON.stringify({ error: "JSON inválido" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { lesson_slug, answers } = body;
    // answers: Array<{ question_key: string; answer_text: string }>

    if (!lesson_slug || !Array.isArray(answers) || answers.length === 0) {
        return new Response(JSON.stringify({ error: "Datos incompletos" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Upsert each answer
    const rows = answers.map((a: any) => ({
        user_id: user.id,
        lesson_slug,
        question_key: a.question_key,
        answer_text: a.answer_text,
        submitted_at: new Date().toISOString(),
    }));

    const { error } = await supabase
        .from("lesson_reflections")
        .upsert(rows, { onConflict: "user_id,lesson_slug,question_key" });

    if (error) {
        console.error("Error saving reflection:", error);
        return new Response(JSON.stringify({ error: "Error al guardar" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Check if the activity requires manual approval
    const activityId = `lesson-${lesson_slug.replace(/\//g, "-")}`;
    const { data: activityData } = await supabase
        .from("activities")
        .select("requires_manual_approval")
        .eq("id", activityId)
        .single();
    
    const requiresApproval = activityData?.requires_manual_approval ?? true;
    const approvalStatus = requiresApproval ? "pending" : "approved";

    // Also mark lesson as completed in progress
    await supabase.from("user_activity_progress").upsert(
        {
            user_id: user.id,
            activity_id: activityId,
            status: "completed",
            approval_status: approvalStatus,
            completed_at: new Date().toISOString(),
            last_visited_at: new Date().toISOString(),
            progress_percentage: 100,
        },
        { onConflict: "user_id,activity_id" }
    );

    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
};

// GET: fetch existing answers for a lesson
export const GET: APIRoute = async ({ locals, url }) => {
    const { supabase, user } = locals as any;

    if (!user) {
        return new Response(JSON.stringify({ error: "No autenticado" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    const lesson_slug = url.searchParams.get("lesson_slug");
    if (!lesson_slug) {
        return new Response(JSON.stringify({ error: "lesson_slug requerido" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { data, error } = await supabase
        .from("lesson_reflections")
        .select("question_key, answer_text, submitted_at")
        .eq("user_id", user.id)
        .eq("lesson_slug", lesson_slug);

    if (error) {
        return new Response(JSON.stringify({ error: "Error al obtener" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    const activityId = `lesson-${lesson_slug.replace(/\//g, "-")}`;
    const { data: progData } = await supabase
        .from("user_activity_progress")
        .select("approval_status, teacher_feedback")
        .eq("user_id", user.id)
        .eq("activity_id", activityId)
        .single();

    return new Response(JSON.stringify({ 
        answers: data,
        approval_status: progData?.approval_status || "not_submitted",
        teacher_feedback: progData?.teacher_feedback || null
    }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
};

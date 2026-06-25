import type { APIRoute } from "astro";

export const prerender = false;

function requireTeacher(locals: any) {
    const role = locals.role;
    return role === "teacher" || role === "admin";
}

// GET /api/teacher/reflections?lesson_slug=...&user_id=...
export const GET: APIRoute = async ({ locals, url }) => {
    if (!requireTeacher(locals)) {
        return new Response(JSON.stringify({ error: "No autorizado" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { supabase } = locals;
    const lessonSlug = url.searchParams.get("lesson_slug");
    const userId = url.searchParams.get("user_id");

    let query = supabase
        .from("lesson_reflections")
        .select(`
            id,
            user_id,
            lesson_slug,
            question_key,
            answer_text,
            submitted_at
        `)
        .order("submitted_at", { ascending: false });

    if (lessonSlug) query = query.eq("lesson_slug", lessonSlug);
    if (userId) query = query.eq("user_id", userId);

    const { data, error } = await query;

    if (error) {
        return new Response(JSON.stringify({ error: "Error al obtener reflexiones" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Enrich with profile names
    const userIds = [...new Set((data ?? []).map((r: any) => r.user_id))];
    let profiles: any[] = [];
    let progressData: any[] = [];

    if (userIds.length > 0) {
        const { data: profileData } = await supabase
            .from("user_profile")
            .select("user_id, full_name, paralelo")
            .in("user_id", userIds);
        profiles = profileData ?? [];

        const { data: progData } = await supabase
            .from("user_activity_progress")
            .select("user_id, activity_id, approval_status")
            .in("user_id", userIds);
        progressData = progData ?? [];
    }

    const profileMap = Object.fromEntries(profiles.map((p: any) => [p.user_id, p]));
    const progressMap = {};
    progressData.forEach((p: any) => {
        progressMap[`${p.user_id}_${p.activity_id}`] = p.approval_status;
    });

    const enriched = (data ?? []).map((r: any) => {
        const activityId = `lesson-${r.lesson_slug.replace(/\//g, "-")}`;
        const approvalStatus = progressMap[`${r.user_id}_${activityId}`] || "not_submitted";
        return {
            ...r,
            student_name: profileMap[r.user_id]?.full_name ?? "Desconocido",
            paralelo: profileMap[r.user_id]?.paralelo ?? "-",
            approval_status: approvalStatus,
            activity_id: activityId,
        };
    });

    return new Response(JSON.stringify({ reflections: enriched }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
};

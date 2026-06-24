import type { APIRoute } from "astro";

export const prerender = false;

function requireTeacher(locals: any) {
    const role = locals.role;
    return role === "teacher" || role === "admin";
}

// GET /api/teacher/students — list all students with progress
export const GET: APIRoute = async ({ locals, url }) => {
    if (!requireTeacher(locals)) {
        return new Response(JSON.stringify({ error: "No autorizado" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { supabase } = locals;
    const paralelo = url.searchParams.get("paralelo");

    // Get all student profiles
    let query = supabase
        .from("user_profile")
        .select("user_id, full_name, paralelo, role, updated_at")
        .eq("role", "student")
        .order("paralelo")
        .order("full_name");

    if (paralelo) {
        query = query.eq("paralelo", paralelo);
    }

    const { data: profiles, error: profilesError } = await query;
    if (profilesError) {
        return new Response(JSON.stringify({ error: "Error al obtener estudiantes" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Get progress counts for each student
    const userIds = (profiles ?? []).map((p: any) => p.user_id);
    let progressData: any[] = [];
    if (userIds.length > 0) {
        const { data } = await supabase
            .from("user_activity_progress")
            .select("user_id, status, last_visited_at, activity_id")
            .in("user_id", userIds);
        progressData = data ?? [];
    }

    // Aggregate progress per user
    const students = (profiles ?? []).map((profile: any) => {
        const userProgress = progressData.filter((p: any) => p.user_id === profile.user_id);
        const completed = userProgress.filter((p: any) => p.status === "completed").length;
        const lastVisit = userProgress
            .map((p: any) => p.last_visited_at)
            .sort()
            .reverse()[0] ?? null;

        return {
            ...profile,
            completed_lessons: completed,
            total_progress_entries: userProgress.length,
            last_visited_at: lastVisit,
        };
    });

    return new Response(JSON.stringify({ students }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
};

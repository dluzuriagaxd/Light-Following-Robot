import { useState, useEffect } from "react";

interface Props {
    activityId: string;
    initialCompleted: boolean;
    className?: string;
}

export default function LessonCheckbox({ activityId, initialCompleted, className = "" }: Props) {
    const [completed, setCompleted] = useState(initialCompleted);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync with localStorage on load
    useEffect(() => {
        const localCompleted = localStorage.getItem(`completed-${activityId}`) || localStorage.getItem(activityId);
        if (localCompleted === "true" || localCompleted === "completed") {
            setCompleted(true);
        }
    }, [activityId]);

    const toggleComplete = async () => {
        setLoading(true);
        setError(null);

        try {
            const endpoint = "/api/progress/complete";
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ activityId }),
            });

            // Even if unauthorized or server error (e.g. Supabase offline), we allow local success
            if (response.ok) {
                setCompleted(true);
            }
            
            // Always save to localStorage to persist state locally (both styles)
            localStorage.setItem(`completed-${activityId}`, "true");
            localStorage.setItem(activityId, "completed");
            setCompleted(true);

        } catch (err) {
            console.error("Error updating progress on server, falling back to local storage:", err);
            // Fallback to local storage on network/server failure
            localStorage.setItem(`completed-${activityId}`, "true");
            localStorage.setItem(activityId, "completed");
            setCompleted(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <button
                onClick={toggleComplete}
                disabled={loading || completed}
                className={`
          flex items-center justify-center gap-3 px-6 py-4 rounded-lg 
          font-medium transition-all duration-200 
          ${completed
                        ? "bg-green-600 text-white cursor-default"
                        : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                    }
          ${loading ? "opacity-70 cursor-wait" : ""}
          disabled:cursor-not-allowed
        `}
            >
                {loading ? (
                    <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Guardando...</span>
                    </>
                ) : completed ? (
                    <>
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Lección Completada</span>
                    </>
                ) : (
                    <>
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Marcar como Completada</span>
                    </>
                )}
            </button>

            {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 px-4 py-2 rounded">
                    {error}
                </div>
            )}

            {completed && (
                <div className="text-green-700 text-sm text-center bg-green-50 px-4 py-2 rounded mt-2">
                    ¡Excelente trabajo! Has completado esta lección. 🎉
                </div>
            )}
        </div>
    );
}

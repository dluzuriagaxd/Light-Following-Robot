import { useState, useEffect } from "react";

interface ReflectionQuestion {
    key: string;
    question: string;
    placeholder?: string;
}

interface ReflectionFormProps {
    lessonSlug: string;
    questions: ReflectionQuestion[];
}

export default function ReflectionForm({ lessonSlug, questions }: ReflectionFormProps) {
    const [answers, setAnswers] = useState<Record<string, string>>(
        Object.fromEntries(questions.map((q) => [q.key, ""]))
    );
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [previousAnswers, setPreviousAnswers] = useState<Record<string, string> | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Check for previous answers on mount
    useEffect(() => {
        fetch(`/api/reflections/submit?lesson_slug=${encodeURIComponent(lessonSlug)}`)
            .then((r) => r.json())
            .then((data: any) => {
                if (data.answers && data.answers.length > 0) {
                    const prev: Record<string, string> = {};
                    data.answers.forEach((a: any) => {
                        prev[a.question_key] = a.answer_text;
                    });
                    setPreviousAnswers(prev);
                    setSubmitted(true);
                }
            })
            .catch(() => {})
            .finally(() => setChecking(false));
    }, [lessonSlug]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate at least one answer
        const filled = Object.values(answers).filter((v) => v.trim().length > 0);
        if (filled.length === 0) {
            setError("Por favor escribe al menos una respuesta antes de continuar.");
            return;
        }

        setLoading(true);

        const payload = {
            lesson_slug: lessonSlug,
            answers: questions
                .filter((q) => answers[q.key]?.trim())
                .map((q) => ({
                    question_key: q.key,
                    answer_text: answers[q.key].trim(),
                })),
        };

        try {
            const res = await fetch("/api/reflections/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json() as any;
            if (!res.ok) throw new Error(data.error || "Error al guardar");
            setSubmitted(true);
            setPreviousAnswers(answers);
        } catch (err: any) {
            setError(err.message || "Ocurrió un error. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <div className="my-8 p-5 bg-slate-50 border border-slate-200 rounded-3xl animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
                <div className="h-20 bg-slate-200 rounded-xl" />
            </div>
        );
    }

    if (submitted && previousAnswers) {
        return (
            <div className="my-8 p-5 bg-green-50 border-2 border-green-200 rounded-3xl font-sans">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center text-green-600 text-lg">
                        ✅
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-green-800">
                            ¡Lección completada! Tu reflexión fue guardada.
                        </h3>
                        <p className="text-xs text-green-600 font-semibold">
                            Tu profesor podrá ver tus respuestas.
                        </p>
                    </div>
                </div>
                <div className="space-y-3">
                    {questions.map((q) => (
                        <div key={q.key} className="p-3 bg-white border border-green-100 rounded-2xl">
                            <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-1">
                                {q.question}
                            </p>
                            <p className="text-sm text-slate-700 font-semibold leading-relaxed">
                                {previousAnswers[q.key] || <span className="text-slate-400 italic">Sin respuesta</span>}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="my-8 p-5 bg-slate-50 border-2 border-slate-200 rounded-3xl font-sans">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-brand-orange/10 rounded-xl flex items-center justify-center text-xl border border-brand-orange/20">
                    🪞
                </div>
                <div>
                    <h3 className="text-sm font-black text-slate-800">
                        Bitácora de Reflexión
                    </h3>
                    <p className="text-[10px] text-slate-500 font-semibold">
                        Responde para marcar esta lección como completada. Tu profesor podrá leer tus respuestas.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {questions.map((q, i) => (
                    <div key={q.key} className="space-y-1.5">
                        <label
                            htmlFor={`reflection-${q.key}`}
                            className="block text-xs font-black text-slate-700"
                        >
                            <span className="text-brand-orange mr-1">{i + 1}.</span>
                            {q.question}
                        </label>
                        <textarea
                            id={`reflection-${q.key}`}
                            rows={3}
                            value={answers[q.key]}
                            onChange={(e) =>
                                setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))
                            }
                            placeholder={q.placeholder ?? "Escribe tu respuesta aquí..."}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange text-slate-800 placeholder-slate-400 outline-none transition-all text-sm font-semibold resize-none"
                        />
                    </div>
                ))}

                {error && (
                    <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl font-semibold">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-brand-orange hover:bg-brand-orange/90 text-white font-black rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-[0_4px_0_#e6950f] hover:shadow-[0_2px_0_#e6950f] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            Guardando...
                        </span>
                    ) : (
                        "✅ Marcar como completada y enviar reflexión →"
                    )}
                </button>
            </form>
        </div>
    );
}

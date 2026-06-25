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
    const [approvalStatus, setApprovalStatus] = useState<string>("not_submitted");
    const [previousAnswers, setPreviousAnswers] = useState<Record<string, string> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [allCheckboxesChecked, setAllCheckboxesChecked] = useState(true);
    const [teacherFeedback, setTeacherFeedback] = useState<string | null>(null);

    // Validate checkboxes
    useEffect(() => {
        const checkCheckboxes = () => {
            const checkboxes = document.querySelectorAll('.prose input[type="checkbox"]');
            if (checkboxes.length === 0) {
                setAllCheckboxesChecked(true);
                return;
            }
            const allChecked = Array.from(checkboxes).every((cb: any) => cb.checked);
            setAllCheckboxesChecked(allChecked);
        };

        checkCheckboxes();
        window.addEventListener('lesson-checkbox-changed', checkCheckboxes);
        return () => window.removeEventListener('lesson-checkbox-changed', checkCheckboxes);
    }, []);

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
                if (data.approval_status) setApprovalStatus(data.approval_status);
                if (data.teacher_feedback) setTeacherFeedback(data.teacher_feedback);
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
            
            // Re-fetch to get updated approval status
            const statusRes = await fetch(`/api/reflections/submit?lesson_slug=${encodeURIComponent(lessonSlug)}`);
            const statusData = await statusRes.json();
            if (statusData.approval_status) setApprovalStatus(statusData.approval_status);
            
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

    if (submitted && previousAnswers && approvalStatus !== 'rejected') {
        const isApproved = approvalStatus === 'approved';
        const isPending = approvalStatus === 'pending';

        return (
            <div className={`my-8 p-5 border-2 rounded-3xl font-sans ${isApproved ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg ${isApproved ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        {isApproved ? '✅' : '⏳'}
                    </div>
                    <div>
                        <h3 className={`text-sm font-black ${isApproved ? 'text-green-800' : 'text-yellow-800'}`}>
                            {isApproved ? '¡Lección Aprobada!' : 'En revisión por el profesor'}
                        </h3>
                        <p className={`text-xs font-semibold ${isApproved ? 'text-green-600' : 'text-yellow-600'}`}>
                            {isApproved ? 'Puedes continuar con la siguiente lección.' : 'Tu profesor debe aprobar tus respuestas antes de continuar.'}
                        </p>
                    </div>
                </div>

                {teacherFeedback && (
                    <div className="mb-4 p-4 bg-white border border-brand-orange/30 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm">👩‍🏫</span>
                            <span className="text-xs font-black uppercase tracking-widest text-brand-orange">Comentario del Profesor</span>
                        </div>
                        <p className="text-sm text-slate-700 italic">"{teacherFeedback}"</p>
                    </div>
                )}

                <div className="space-y-3">
                    {questions.map((q) => (
                        <div key={q.key} className={`p-3 bg-white border rounded-2xl ${isApproved ? 'border-green-100' : 'border-yellow-100'}`}>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isApproved ? 'text-green-700' : 'text-yellow-700'}`}>
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
                        {approvalStatus === 'rejected' ? '❌ Reflexión Rechazada' : 'Bitácora de Reflexión'}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-semibold">
                        {approvalStatus === 'rejected' ? 'Tu profesor rechazó tus respuestas anteriores. Por favor, corrígelas y vuelve a enviar.' : 'Responde para marcar esta lección como completada. Tu profesor podrá leer tus respuestas.'}
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

                {!allCheckboxesChecked && !error && (
                    <div className="p-3 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-xl font-semibold flex items-center gap-2">
                        <span>⚠️</span> Debes marcar todas las casillas de materiales o lecturas requeridas en la lección antes de enviar.
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !allCheckboxesChecked}
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

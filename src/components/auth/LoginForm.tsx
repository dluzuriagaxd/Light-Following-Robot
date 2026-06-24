import { useState } from "react";
import { getBrowserClient } from "../../lib/supabase";

interface LoginFormProps {
    hideRegisterLink?: boolean;
}

export default function LoginForm({ hideRegisterLink = false }: LoginFormProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const supabase = getBrowserClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            setError("Correo o contraseña incorrectos. Intenta de nuevo.");
            setLoading(false);
        } else {
            // Redirect based on role
            const role = data.user?.app_metadata?.role;
            if (role === "teacher" || role === "admin") {
                window.location.href = "/docente";
            } else {
                window.location.href = "/";
            }
        }
    };

    return (
        <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-brand-orange rounded-2xl shadow-[0_0_30px_rgba(255,171,25,0.4)] flex items-center justify-center text-3xl mx-auto mb-4">
                    💡
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-800">
                    Academia Seguidor de Luz
                </h1>
                <p className="mt-1 text-sm text-slate-500 font-semibold">
                    Inicia sesión con las credenciales que te dio tu profesor
                </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl font-semibold text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label htmlFor="email" className="block text-xs font-black text-slate-600 uppercase tracking-widest">
                            Correo electrónico
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange text-slate-800 placeholder-slate-400 outline-none transition-all text-sm font-semibold"
                            placeholder="tu.nombre@correo.com"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="password" className="block text-xs font-black text-slate-600 uppercase tracking-widest">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange text-slate-800 placeholder-slate-400 outline-none transition-all text-sm font-semibold"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-brand-orange hover:bg-brand-orange/90 text-white font-black rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed tracking-wide text-sm shadow-[0_4px_0_#e6950f] hover:shadow-[0_2px_0_#e6950f] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                </svg>
                                Verificando...
                            </span>
                        ) : (
                            "Entrar al Curso →"
                        )}
                    </button>

                    {!hideRegisterLink && (
                        <div className="text-center pt-2 border-t border-slate-100">
                            <a href="/register" className="text-xs text-brand-blue hover:underline font-semibold transition-colors">
                                ¿Primera vez aquí? Crear cuenta
                            </a>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

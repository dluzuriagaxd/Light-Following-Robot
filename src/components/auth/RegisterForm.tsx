import { useState } from "react";
import { getBrowserClient } from "../../lib/supabase";

export default function RegisterForm() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const supabase = getBrowserClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                }
            }
        });

        if (signUpError) {
            setError(signUpError.message || "Error al registrarse. Intenta de nuevo.");
            setLoading(false);
        } else {
            setLoading(false);
            setSuccess(true);
            setTimeout(() => {
                window.location.href = "/login";
            }, 3000);
        }
    };

    if (success) {
        return (
            <div className="w-full max-w-md">
                <div className="bg-white border border-green-200 rounded-3xl p-8 shadow-sm text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-50 border-2 border-green-200 rounded-2xl flex items-center justify-center text-3xl">
                        ✅
                    </div>
                    <h2 className="text-xl font-black text-slate-800 mb-2">¡Cuenta creada!</h2>
                    <p className="text-slate-500 text-sm font-semibold">
                        Tu cuenta fue creada exitosamente. Redirigiendo al inicio de sesión...
                    </p>
                </div>
            </div>
        );
    }

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
                    Crea tu cuenta de estudiante
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
                        <label htmlFor="fullName" className="block text-xs font-black text-slate-600 uppercase tracking-widest">
                            Nombre completo
                        </label>
                        <input
                            id="fullName"
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange text-slate-800 placeholder-slate-400 outline-none transition-all text-sm font-semibold"
                            placeholder="Juan Pérez"
                        />
                    </div>

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
                            placeholder="juan.perez@correo.com"
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
                            minLength={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange text-slate-800 placeholder-slate-400 outline-none transition-all text-sm font-semibold"
                            placeholder="Mínimo 8 caracteres"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-brand-orange hover:bg-brand-orange/90 text-white font-black rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed tracking-wide text-sm shadow-[0_4px_0_#e6950f] hover:shadow-[0_2px_0_#e6950f] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]"
                    >
                        {loading ? "Creando cuenta..." : "Crear Cuenta →"}
                    </button>

                    <div className="text-center pt-2 border-t border-slate-100">
                        <a href="/login" className="text-xs text-slate-500 hover:text-brand-orange font-semibold transition-colors">
                            ← Ya tengo cuenta, iniciar sesión
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}

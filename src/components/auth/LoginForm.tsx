import { useState } from "react";
import { signIn } from "../../lib/auth-client";

interface LoginFormProps {
    hideRegisterLink?: boolean;
}

export default function LoginForm({ hideRegisterLink = false }: LoginFormProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        await signIn.email({
            email,
            password,
            callbackURL: "/", // Redirigir al inicio (index.astro maneja la lógica)
        }, {
            onError: (ctx) => {
                const err = ctx.error;
                console.error("Login error details:", err);
                // Extract detailed error message
                let detailedMsg = err.message || err.statusText;
                // @ts-ignore
                if (err.body?.message) detailedMsg = err.body.message;
                // @ts-ignore
                if (err.error) detailedMsg = err.error;

                setError(detailedMsg || "Invalid credentials or server error");
                setLoading(false);
            },
            onSuccess: () => {
                // La redirección la maneja better-auth, pero podemos limpiar estado si es necesario
                setLoading(false);
            }
        });
    };

    return (
        <div className="w-full max-w-md p-8 rounded-xl bg-[#0a0a0a] border border-white/10 shadow-[0_0_50px_-12px_rgba(249,115,22,0.1)]">
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                    <span className="text-brand-orange">SYSTEM</span> ACCESS
                </h2>
                <p className="mt-2 text-sm text-white/40 font-mono tracking-wide uppercase">
                    Enter credentials to proceed
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-900/50 rounded font-mono">
                        [ERROR] {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label htmlFor="email" className="block text-xs font-bold text-white/50 uppercase tracking-widest font-mono">
                        Employee ID / Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange text-white placeholder-white/20 outline-none transition-all font-mono text-sm"
                        placeholder="operator@lfr.system"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="password" className="block text-xs font-bold text-white/50 uppercase tracking-widest font-mono">
                        Security Key
                    </label>
                    <input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange text-white placeholder-white/20 outline-none transition-all font-mono text-sm"
                        placeholder="••••••••"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-brand-orange hover:bg-brand-orange/90 text-black font-bold rounded-lg transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)]"
                >
                    {loading ? (
                        <span className="animate-pulse">Authenticating...</span>
                    ) : (
                        "Initialize Session"
                    )}
                </button>

                {!hideRegisterLink && (
                    <div className="text-center pt-4 border-t border-white/5">
                        <a href="/register" className="text-xs text-brand-blue hover:text-brand-blue/80 font-mono transition-colors">
                            [NEW OPERATOR REGISTRATION]
                        </a>
                    </div>
                )}
            </form>
        </div>
    );
}

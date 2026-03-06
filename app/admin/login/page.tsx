"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/admin");
    } catch (err: any) {
      console.error(err);
      setError("No se pudo iniciar sesión. Verifica tus credenciales.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-samsungBlue">
            Acceso restringido
          </p>
          <h1 className="text-lg font-semibold text-slate-900">Panel de administrador</h1>
          <p className="text-xs text-slate-600">
            Solo personal autorizado de Samsung Ecuador puede gestionar ciudades, puntos y promociones.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Correo corporativo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-samsungBlue/20 focus:border-samsungBlue focus:bg-white focus:ring-2"
              placeholder="admin@tuempresa.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-samsungBlue/20 focus:border-samsungBlue focus:bg-white focus:ring-2"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center text-sm"
          >
            {loading ? "Procesando…" : "Entrar"}
          </button>

          <p className="text-[11px] text-slate-500">
            La cuenta de administrador se crea únicamente desde backend. Comparte las credenciales solo con el equipo responsable.
          </p>
        </form>
      </div>
    </div>
  );
}

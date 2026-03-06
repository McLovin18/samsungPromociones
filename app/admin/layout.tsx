"use client";

import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (!u && !pathname.startsWith("/admin/login")) {
        router.replace("/admin/login");
      }
      if (u && pathname.startsWith("/admin/login")) {
        router.replace("/admin");
      }
    });
    return () => unsub();
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">Cargando panel de administrador…</p>
      </div>
    );
  }

  if (!user && pathname.startsWith("/admin/login")) {
    return children;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-56px)] space-y-4">
      <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-900 px-4 py-3 text-slate-50">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Panel de administrador
            </p>
            <p className="text-sm font-medium">Promociones Samsung Ecuador</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-200">
            <span className="hidden sm:inline">{user.email}</span>
            <button
              onClick={async () => {
                await auth.signOut();
                router.replace("/admin/login");
              }}
              className="rounded-full border border-slate-500 px-3 py-1 text-[11px] font-medium hover:bg-slate-800"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        <nav className="mt-1 flex gap-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className={`rounded-full px-3 py-1.5 transition ${
              pathname === "/admin"
                ? "bg-white text-slate-900 shadow-sm"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700"
            }`}
          >
            Inicio
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/promotions")}
            className={`rounded-full px-3 py-1.5 transition ${
              pathname.startsWith("/admin/promotions")
                ? "bg-white text-slate-900 shadow-sm"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700"
            }`}
          >
            Promociones
          </button>
        </nav>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

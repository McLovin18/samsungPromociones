"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Client {
  id: string;
  name: string;
  email: string;
  city: string;
  phone?: string;
  createdAt?: any;
  gift?: { id: string; name: string };
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setClients(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return "-";
    return new Date(timestamp.toDate()).toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-bold text-white mb-2">
        Clientes registrados (Newsletter)
      </h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-md">
        <table className="min-w-full text-sm divide-y divide-slate-200">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide">Nombre</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide">Correo</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide">Teléfono</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide">Ciudad</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide">Registro regalo</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide">Fecha registro</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {clients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-3 text-center text-slate-500">
                  Aún no hay registros.
                </td>
              </tr>
            )}
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2 text-slate-800">{client.name}</td>
                <td className="px-4 py-2 text-slate-800">{client.email}</td>
                <td className="px-4 py-2 text-slate-800">{client.phone || "-"}</td>
                <td className="px-4 py-2 text-slate-800">{client.city}</td>
                <td className="px-4 py-2 text-slate-800">{client.gift ? client.gift.name : '-'}</td>
                <td className="px-4 py-2 text-slate-600">{formatDate(client.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, serverTimestamp, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface City {
  id: string;
  name: string;
}

export default function NewsletterSection() {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [activeGift, setActiveGift] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    const loadCities = async () => {
      try {
        const ref = collection(db, "cities");
        const snap = await getDocs(ref);
        const items: City[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setCities(items);
      } catch (err) {
        console.error("Error cargando ciudades para newsletter", err);
      }
    };
    loadCities();

    // Buscar regalo activo
    const loadActiveGift = async () => {
      try {
        const q = query(collection(db, "gifts"), where("popupActive", "==", true));
        const snap = await getDocs(q);
        if (!snap.empty) {
          // Solo uno puede estar activo
          const docData = snap.docs[0].data();
          setActiveGift({ id: snap.docs[0].id, name: docData.name });
        } else {
          setActiveGift(null);
        }
      } catch (err) {
        setActiveGift(null);
      }
    };
    loadActiveGift();
  }, []);

  const canRegister = () => {
    const last = localStorage.getItem("newsletter_last_submit");
    if (!last) return true;
    const lastTime = parseInt(last, 10);
    return Date.now() - lastTime > 5 * 60 * 1000; // 5 minutos
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    if (!canRegister()) {
      setError("Debes esperar 5 minutos antes de volver a registrarte.");
      setSubmitting(false);
      return;
    }

    if (!name.trim() || !email.trim() || !selectedCityId || !phone.trim()) {
      setError("Por favor completa todos los campos obligatorios.");
      setSubmitting(false);
      return;
    }

    try {
      // Validar si ya existe el correo
      const q = query(collection(db, "clients"), where("email", "==", email.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setError("Ya hay alguien inscrito con ese correo.");
        setSubmitting(false);
        return;
      }
      const clientData: any = {
        name: name.trim(),
        email: email.trim(),
        city: selectedCityId,
        phone: phone.trim(),
        createdAt: serverTimestamp(),
      };
      if (activeGift) {
        clientData.gift = activeGift;
        clientData.giftId = activeGift.id;
      }
      await addDoc(collection(db, "clients"), clientData);
      localStorage.setItem("newsletter_last_submit", Date.now().toString());
      setSuccess(true);
      setName("");
      setEmail("");
      setPhone("");
      setSelectedCityId("");
    } catch (err: any) {
      let msg = "Ocurrió un error al registrar. Intenta de nuevo.";
      if (err && typeof err === "object" && err.message) {
        msg += `\n${err.message}`;
      } else if (typeof err === "string") {
        msg += `\n${err}`;
      }
      setError(msg);
      console.error("Error al registrar newsletter:", err);
    }

    setSubmitting(false);
  };

  // Ordenar ciudades A-Z por nombre
  const sortedCities = [...cities].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

  return (
    <section className="w-full py-16 bg-slate-900">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-8 text-center space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Mantente informado
          </p>
          <h2 className="text-3xl font-bold text-white">
            Suscríbete para recibir las últimas promociones Samsung
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-800 rounded-xl p-6 shadow-lg space-y-4"
        >
          {success && (
            <div className="rounded bg-green-100 px-3 py-2 text-green-800 text-sm font-medium">
              ¡Gracias por suscribirte!
            </div>
          )}
          {error && (
            <div className="rounded bg-red-100 px-3 py-2 text-red-800 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-white">Tu nombre *</label>
              <input
                type="text"
                className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-samsungBlue focus:border-samsungBlue"
                placeholder="Nombre completo"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-white">Ciudad *</label>
              <select
                className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-samsungBlue focus:border-samsungBlue"
                value={selectedCityId}
                onChange={(e) => setSelectedCityId(e.target.value)}
                disabled={submitting}
                required
              >
                <option value="" disabled>
                  Selecciona tu ciudad
                </option>
                {sortedCities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-white">Teléfono *</label>
              <input
                type="tel"
                className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-samsungBlue focus:border-samsungBlue"
                placeholder="0991234567"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-white">Correo *</label>
              <input
                type="email"
                className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-samsungBlue focus:border-samsungBlue"
                placeholder="correo@ejemplo.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg bg-samsungBlue text-white font-semibold text-lg transition hover:bg-samsungBlue/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Enviando..." : "Suscribirse"}
          </button>

        </form>
      </div>
    </section>
  );
}
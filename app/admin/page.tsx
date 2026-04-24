"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface City {
  id: string;
  name: string;
}

interface Place {
  id: string;
  name: string;
  cityId: string;
  cityName: string;
  locationUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  storeName?: string | null;
  address?: string | null;
  image?: string | null;
  localHours?: Array<{
    dayFrom: string;
    dayTo: string;
    hourFrom: string;
    hourTo: string;
  }> | null;
  order?: number;
}

export default function AdminDashboardPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);

  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [activeCityId, setActiveCityId] = useState<string | null>(null);
  const [placeModalOpen, setPlaceModalOpen] = useState(false);
  const [draggedPlaceId, setDraggedPlaceId] = useState<string | null>(null);
  const [dragOverPlaceId, setDragOverPlaceId] = useState<string | null>(null);

  const [newCityName, setNewCityName] = useState("");
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);

  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceLocationUrl, setNewPlaceLocationUrl] = useState("");
  const [newPlacePhone, setNewPlacePhone] = useState("");
  const [newPlaceEmail, setNewPlaceEmail] = useState("");
  const [newPlaceStoreName, setNewPlaceStoreName] = useState("");
  const [newPlaceAddress, setNewPlaceAddress] = useState("");
  const [newPlaceImage, setNewPlaceImage] = useState("");
  const [newPlaceHours, setNewPlaceHours] = useState<Array<{ dayFrom: string; dayTo: string; hourFrom: string; hourTo: string }>>([
    { dayFrom: "", dayTo: "", hourFrom: "", hourTo: "" },
  ]);

  // --- Snapshot de ciudades y lugares ---
  useEffect(() => {
    const unsubCities = onSnapshot(query(collection(db, "cities"), orderBy("name")), (snap) => {
      setCities(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });

    const unsubPlaces = onSnapshot(collection(db, "places"), (snap) => {
      const placesData = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      // Ordenar: primero por order (si existe), luego por name
      placesData.sort((a, b) => {
        const orderA = typeof a.order === 'number' ? a.order : Infinity;
        const orderB = typeof b.order === 'number' ? b.order : Infinity;
        if (orderA !== orderB) return orderA - orderB;
        return (a.name || '').localeCompare(b.name || '');
      });
      setPlaces(placesData);
    });

    return () => {
      unsubCities();
      unsubPlaces();
    };
  }, []);

  const selectedCity = cities.find((c) => c.id === activeCityId) ?? null;

  // --- Reset formularios de lugar ---
  const resetPlaceForm = () => {
    setEditingPlaceId(null);
    setNewPlaceName("");
    setNewPlaceLocationUrl("");
    setNewPlacePhone("");
    setNewPlaceEmail("");
    setNewPlaceStoreName("");
    setNewPlaceAddress("");
    setNewPlaceImage("");
    setNewPlaceHours([{ dayFrom: "", dayTo: "", hourFrom: "", hourTo: "" }]);
  };

  // --- Crear ciudad ---
  const handleCreateCity = async () => {
    if (!newCityName.trim()) return;
    try {
      await addDoc(collection(db, "cities"), {
        name: newCityName.trim(),
        createdAt: new Date(),
      });
      setNewCityName("");
      setCityModalOpen(false);
    } catch (error) {
      console.error("Error al crear ciudad:", error);
    }
  };

  // --- Crear / Editar lugar ---
  const handleCreatePlace = async () => {
    if (!newPlaceName.trim() || !selectedCity) return;

    const payload = {
      name: newPlaceName.trim(),
      cityId: selectedCity.id,
      cityName: selectedCity.name,
      locationUrl: newPlaceLocationUrl.trim() || null,
      phone: newPlacePhone.trim() || null,
      email: newPlaceEmail.trim() || null,
      storeName: newPlaceStoreName.trim() || null,
      address: newPlaceAddress.trim() || null,
      image: newPlaceImage.trim() || null,
      localHours:
        newPlaceHours.filter((h) => h.dayFrom && h.dayTo && h.hourFrom && h.hourTo).length > 0
          ? newPlaceHours.filter((h) => h.dayFrom && h.dayTo && h.hourFrom && h.hourTo)
          : null,
    };

    try {
      if (editingPlaceId) {
        await updateDoc(doc(db, "places", editingPlaceId), payload);
      } else {
        // Calcular el siguiente número de orden para esta ciudad
        const cityPlaces = placesByCity[selectedCity.id] || [];
        const nextOrder = cityPlaces.length;
        await addDoc(collection(db, "places"), { ...payload, createdAt: new Date(), order: nextOrder });
      }
      resetPlaceForm();
      setPlaceModalOpen(false);
    } catch (error) {
      console.error("Error al guardar lugar:", error);
    }
  };

  // --- Manejar reordenamiento de lugares ---
  const handleReorderPlaces = async (draggedId: string, targetId: string) => {
    if (draggedId === targetId || !selectedCity) return;

    const cityPlaces = placesByCity[selectedCity.id] || [];
    const draggedIndex = cityPlaces.findIndex((p) => p.id === draggedId);
    const targetIndex = cityPlaces.findIndex((p) => p.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Crear array reordenado
    const reordered = [...cityPlaces];
    const [draggedPlace] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedPlace);

    // Actualizar órdenes en Firestore
    try {
      for (let i = 0; i < reordered.length; i++) {
        await updateDoc(doc(db, "places", reordered[i].id), { order: i });
      }
    } catch (error) {
      console.error("Error al reordenar lugares:", error);
    }
  };

  // --- Map de lugares por ciudad para eficiencia ---
  const placesByCity = places.reduce((acc, p) => {
    if (!acc[p.cityId]) acc[p.cityId] = [];
    acc[p.cityId].push(p);
    return acc;
  }, {} as Record<string, Place[]>);

  return (
    <div className="space-y-6">
      {/* --- Sección principal --- */}
      <section className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* --- Ciudades --- */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Ciudades de Ecuador</p>
              <p className="text-sm text-slate-700">Comienza creando las ciudades donde Samsung tiene presencia.</p>
            </div>
            <button onClick={() => setCityModalOpen(true)} className="btn-primary text-xs px-3 py-1.5">Crear ciudad</button>
          </div>

          <div className="mt-2 space-y-1 text-sm">
            {cities.length === 0 && <p className="text-xs text-slate-500">Aún no hay ciudades creadas.</p>}
            {cities.map((city) => (
              <button
                key={city.id}
                onClick={() => {
                  setActiveCityId(city.id);
                  resetPlaceForm();
                  setPlaceModalOpen(true);
                }}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs hover:border-samsungBlue/60"
              >
                <span className="font-medium text-slate-800">{city.name}</span>
                <span className="text-[11px] text-slate-500">Ver lugares</span>
              </button>
            ))}
          </div>
        </div>

        {/* --- Resumen rápido --- */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Resumen rápido</p>
              <p className="text-sm text-slate-700">Estructura actual</p>
            </div>
          </div>

          <div className="grid gap-3 text-xs sm:grid-cols-3">
            <div className="rounded-xl bg-slate-100 p-3">
              <p className="text-[11px] text-slate-500">Ciudades</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{cities.length}</p>
            </div>
            <div className="rounded-xl bg-slate-100 p-3">
              <p className="text-[11px] text-slate-500">Puntos de venta</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{places.length}</p>
            </div>
          </div>

          <div className="mt-2 max-h-72 space-y-2 overflow-auto rounded-xl border border-slate-100 bg-slate-50 p-3">
            {cities.map((city) => (
              <div key={city.id} className="space-y-1">
                <p className="text-xs font-semibold text-black">{city.name}</p>
                <p className="pl-3 text-[11px] text-slate-500">{placesByCity[city.id]?.length || 0} puntos de venta</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Modal de Ciudad --- */}
      {cityModalOpen && (
        <Modal title="Crear ciudad" onClose={() => setCityModalOpen(false)}>
          <div className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Nueva ciudad</label>
              <input
                type="text"
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-samsungBlue/20 focus:border-samsungBlue focus:bg-white focus:ring-2"
                placeholder="Quito, Guayaquil, Cuenca…"
              />
              <div className="flex justify-end pt-1 text-xs">
                <button onClick={handleCreateCity} className="btn-primary px-4 py-1.5">Guardar ciudad</button>
              </div>
            </div>

            <div className="max-h-64 space-y-2 overflow-auto rounded-lg border border-slate-100 bg-slate-50 p-2">
              {cities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => {
                    setActiveCityId(city.id);
                    resetPlaceForm();
                    setPlaceModalOpen(true);
                  }}
                  className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-1.5 text-left text-xs hover:border-samsungBlue/60"
                >
                  <span className="text-black">{city.name}</span>
                  <span className="text-[11px] text-slate-500">{placesByCity[city.id]?.length || 0} puntos</span>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* --- Modal de Lugar --- */}
      {placeModalOpen && selectedCity && (
        <Modal title={`Lugares en ${selectedCity.name}`} onClose={() => { setPlaceModalOpen(false); setActiveCityId(null); resetPlaceForm(); }}>
          <div className="space-y-4 text-sm">
            {/* Scroll interno solo para campos de formulario */}
            <div className="max-h-80 overflow-y-auto pr-2 space-y-4">
              {/* Nombre del lugar */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  {editingPlaceId ? "Editar lugar / punto" : "Nuevo lugar / punto"}
                </label>
                <input
                  type="text"
                  value={newPlaceName}
                  onChange={(e) => setNewPlaceName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-samsungBlue/20 focus:border-samsungBlue focus:bg-white focus:ring-2"
                  placeholder="Samsung Mall del Sol, Samsung Quicentro…"
                />
              </div>

              {/* Dirección */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Dirección</label>
                <input
                  type="text"
                  value={newPlaceAddress}
                  onChange={(e) => setNewPlaceAddress(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-samsungBlue/20 focus:border-samsungBlue focus:bg-white focus:ring-2"
                  placeholder="Piso 1 junto al Patio de Comidas y Multicines"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={newPlaceEmail}
                  onChange={(e) => setNewPlaceEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-samsungBlue/20 focus:border-samsungBlue focus:bg-white focus:ring-2"
                  placeholder="kiosk.malldelnorte@mirgor.com"
                />
              </div>

              {/* Teléfono */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Teléfono</label>
                <input
                  type="text"
                  value={newPlacePhone}
                  onChange={(e) => setNewPlacePhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-samsungBlue/20 focus:border-samsungBlue focus:bg-white focus:ring-2"
                  placeholder="593992118682"
                />
              </div>

              {/* Nombre del local (storeName) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Nombre del local (opcional)</label>
                <input
                  type="text"
                  value={newPlaceStoreName}
                  onChange={(e) => setNewPlaceStoreName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-samsungBlue/20 focus:border-samsungBlue focus:bg-white focus:ring-2"
                  placeholder="Av. Francisco de Orellana Mz. 2576 / Nivel 2, Isla 215"
                />
              </div>

              {/* URL de ubicación */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">URL de ubicación (Google Maps)</label>
                <input
                  type="url"
                  value={newPlaceLocationUrl}
                  onChange={(e) => setNewPlaceLocationUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-samsungBlue/20 focus:border-samsungBlue focus:bg-white focus:ring-2"
                  placeholder="https://maps.google.com/..."
                />
              </div>

              {/* Horarios */}
              <div className="space-y-1.5 pt-2">
              <label className="text-xs font-medium text-slate-700">Horario del local</label>
              {newPlaceHours.map((h, idx) => (
                <div key={idx} className="flex flex-wrap gap-2 items-end mb-2">
                  {["dayFrom", "dayTo", "hourFrom", "hourTo"].map((field) => (
                    <div key={field}>
                      <label className="block text-[11px] text-slate-600">
                        {field === "dayFrom" ? "Día desde" : field === "dayTo" ? "Día hasta" : field === "hourFrom" ? "Hora desde" : "Hora hasta"}
                      </label>
                      {field.includes("day") ? (
                        <select
                          value={h[field as keyof typeof h]}
                          onChange={(e) => {
                            const arr = [...newPlaceHours];
                            arr[idx][field as keyof typeof h] = e.target.value;
                            setNewPlaceHours(arr);
                          }}
                          className="rounded border text-black  px-2 py-1 text-xs"
                        >
                          <option value="">--</option>
                          {["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="time"
                          value={h[field as keyof typeof h]}
                          onChange={(e) => {
                            const arr = [...newPlaceHours];
                            arr[idx][field as keyof typeof h] = e.target.value;
                            setNewPlaceHours(arr);
                          }}
                          className="text-black rounded border px-2 py-1 text-xs"
                        />
                      )}
                    </div>
                  ))}
                  {newPlaceHours.length > 1 && (
                    <button type="button" className="ml-2 text-xs text-red-500 font-bold" onClick={() => setNewPlaceHours(newPlaceHours.filter((_, i) => i !== idx))}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="mt-1 px-2 py-1 rounded bg-samsungBlue text-white text-xs font-semibold hover:bg-samsungBlue/80 transition"
                onClick={() => setNewPlaceHours([...newPlaceHours, { dayFrom: "", dayTo: "", hourFrom: "", hourTo: "" }])}
              >
                + Agregar horario
              </button>
              <p className="text-[11px] text-slate-500 mt-1">
                Ejemplo: Lunes a Sábado, 10:00 a 20:00. Puedes agregar varios bloques para diferentes días.
              </p>
            </div>

            {/* Imagen */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-medium text-slate-700">Imagen promocional del local</label>
              <input
                type="url"
                value={newPlaceImage}
                onChange={(e) => setNewPlaceImage(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-samsungBlue/20 focus:border-samsungBlue focus:bg-white focus:ring-2"
                placeholder="https://ejemplo.com/imagen-promocional.png"
              />
              <p className="text-[11px] text-slate-500">
                URL de la imagen promocional que el cliente presentará en el local para validar su promoción.
              </p>
            </div>

            {/* Guardar */}
            <div className="flex justify-end pt-1 text-xs">
              <button onClick={handleCreatePlace} className="btn-primary px-4 py-1.5">
                {editingPlaceId ? "Actualizar lugar" : "Guardar lugar"}
              </button>
            </div>
            </div>

            {/* Listado de lugares */}
            <div className="max-h-64 space-y-1.5 overflow-auto rounded-lg border border-slate-100 bg-slate-50 p-2">
              {(placesByCity[selectedCity.id]?.length || 0) === 0 && <p className="text-xs text-slate-500">Aún no hay lugares en esta ciudad.</p>}
              {placesByCity[selectedCity.id]?.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  draggable
                  onDragStart={() => setDraggedPlaceId(place.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverPlaceId(place.id);
                  }}
                  onDragLeave={() => setDragOverPlaceId(null)}
                  onDrop={() => {
                    if (draggedPlaceId) {
                      handleReorderPlaces(draggedPlaceId, place.id);
                      setDraggedPlaceId(null);
                      setDragOverPlaceId(null);
                    }
                  }}
                  onClick={() => {
                    setEditingPlaceId(place.id);
                    setNewPlaceName(place.name || "");
                    setNewPlaceLocationUrl(place.locationUrl || "");
                    setNewPlacePhone(place.phone || "");
                    setNewPlaceEmail(place.email || "");
                    setNewPlaceStoreName(place.storeName || "");
                    setNewPlaceAddress(place.address || "");
                    setNewPlaceImage(place.image || "");
                    setNewPlaceHours(
                      place.localHours && place.localHours.length > 0
                        ? place.localHours
                        : [{ dayFrom: "", dayTo: "", hourFrom: "", hourTo: "" }]
                    );
                  }}
                  className={`flex w-full items-center justify-between rounded-md border px-3 py-1.5 text-xs transition-all ${
                    draggedPlaceId === place.id
                      ? "opacity-50 border-samsungBlue bg-samsungBlue/10"
                      : dragOverPlaceId === place.id
                      ? "border-samsungBlue bg-samsungBlue/5"
                      : "border-slate-200 bg-white hover:border-samsungBlue/60"
                  }`}
                >
                  <span className="font-medium text-slate-900">{place.name}</span>
                  <span className="text-[11px] text-slate-600">{selectedCity.name}</span>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

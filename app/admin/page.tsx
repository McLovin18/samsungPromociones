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
  locationUrl?: string;
  phone?: string | null;
  email?: string | null;
  storeName?: string | null;
  address?: string | null;
}

export default function AdminDashboardPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);

  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [activeCityId, setActiveCityId] = useState<string | null>(null);
  const [placeModalOpen, setPlaceModalOpen] = useState(false);

  const [newCityName, setNewCityName] = useState("");
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceLocationUrl, setNewPlaceLocationUrl] = useState("");
  const [newPlacePhone, setNewPlacePhone] = useState("");
  const [newPlaceEmail, setNewPlaceEmail] = useState("");
  const [newPlaceStoreName, setNewPlaceStoreName] = useState("");
  const [newPlaceAddress, setNewPlaceAddress] = useState("");
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);

  useEffect(() => {
    const unsubCities = onSnapshot(query(collection(db, "cities"), orderBy("name")), (snap) => {
      setCities(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    const unsubPlaces = onSnapshot(query(collection(db, "places"), orderBy("name")), (snap) => {
      setPlaces(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });

    return () => {
      unsubCities();
      unsubPlaces();
    };
  }, []);

  const selectedCity = cities.find((c) => c.id === activeCityId) ?? null;

  const handleCreateCity = async () => {
    if (!newCityName.trim()) return;
    await addDoc(collection(db, "cities"), {
      name: newCityName.trim(),
      createdAt: new Date(),
    });
    setNewCityName("");
    setCityModalOpen(false);
  };

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
    };

    if (editingPlaceId) {
      await updateDoc(doc(db, "places", editingPlaceId), payload);
    } else {
      await addDoc(collection(db, "places"), {
        ...payload,
        createdAt: new Date(),
      });
    }
    setNewPlaceName("");
    setNewPlaceLocationUrl("");
    setNewPlacePhone("");
    setNewPlaceEmail("");
    setNewPlaceStoreName("");
    setNewPlaceAddress("");
    setEditingPlaceId(null);
    setPlaceModalOpen(false);
  };

  return (
    <div className="space-y-6">


      <section className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Ciudades de Ecuador
              </p>
              <p className="text-sm text-slate-700">Comienza creando las ciudades donde Samsung tiene presencia.</p>
            </div>
            <button
              onClick={() => {
                setCityModalOpen(true);
              }}
              className="btn-primary text-xs px-3 py-1.5"
            >
              Crear ciudad
            </button>
          </div>
          <div className="mt-2 space-y-1 text-sm">
            {cities.length === 0 && (
              <p className="text-xs text-slate-500">Aún no hay ciudades creadas.</p>
            )}
            {cities.map((city) => (
              <button
                key={city.id}
                onClick={() => {
                  setActiveCityId(city.id);
                  setEditingPlaceId(null);
                  setNewPlaceName("");
                  setNewPlaceLocationUrl("");
                  setNewPlacePhone("");
                  setNewPlaceEmail("");
                  setNewPlaceStoreName("");
                  setNewPlaceAddress("");
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

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Resumen rápido
              </p>
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
            {cities.length === 0 && <p className="text-xs text-slate-500">Sin ciudades aún.</p>}
            {cities.map((city) => (
              <div key={city.id} className="space-y-1">
                <p className="text-xs font-semibold text-slate-800">{city.name}</p>
                <p className="pl-3 text-[11px] text-slate-500">
                  {places.filter((p) => p.cityId === city.id).length} puntos de venta
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {cityModalOpen && (
        <Modal
          onClose={() => {
            setCityModalOpen(false);
          }}
          title="Crear ciudad"
        >
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
                <button onClick={handleCreateCity} className="btn-primary px-4 py-1.5">
                  Guardar ciudad
                </button>
              </div>
            </div>

            <div className="max-h-64 space-y-2 overflow-auto rounded-lg border border-slate-100 bg-slate-50 p-2">
              {cities.length === 0 && (
                <p className="text-xs text-slate-500">Aún no hay ciudades creadas.</p>
              )}
              {cities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => {
                    setActiveCityId(city.id);
                    setEditingPlaceId(null);
                    setNewPlaceName("");
                    setNewPlaceLocationUrl("");
                    setNewPlacePhone("");
                    setNewPlaceEmail("");
                    setNewPlaceStoreName("");
                    setNewPlaceAddress("");
                    setPlaceModalOpen(true);
                  }}
                  className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-1.5 text-left text-xs hover:border-samsungBlue/60"
                >
                  <span>{city.name}</span>
                  <span className="text-[11px] text-slate-500">
                    {places.filter((p) => p.cityId === city.id).length} puntos
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {placeModalOpen && selectedCity && (
        <Modal
          onClose={() => {
            setPlaceModalOpen(false);
            setActiveCityId(null);
            setEditingPlaceId(null);
            setNewPlaceName("");
            setNewPlaceLocationUrl("");
            setNewPlacePhone("");
            setNewPlaceEmail("");
            setNewPlaceStoreName("");
            setNewPlaceAddress("");
          }}
          title={`Lugares en ${selectedCity.name}`}
        >
          <div className="space-y-4 text-sm">
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
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-medium text-slate-700">URL de ubicación (Google Maps)</label>
                <input
                  type="url"
                  value={newPlaceLocationUrl}
                  onChange={(e) => setNewPlaceLocationUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-samsungBlue/20 focus:border-samsungBlue focus:bg-white focus:ring-2"
                  placeholder="https://maps.google.com/..."
                />
                <p className="text-[11px] text-slate-500">
                  Este enlace se mostrará al cliente como botón de "Ubicación" en la landing.
                </p>
              </div>
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-medium text-slate-700">Teléfono de contacto (WhatsApp)</label>
                <input
                  type="tel"
                  value={newPlacePhone}
                  onChange={(e) => setNewPlacePhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-samsungBlue/20 focus:border-samsungBlue focus:bg-white focus:ring-2"
                  placeholder="Ej: +593 99 123 4567"
                />
                <p className="text-[11px] text-slate-500">
                  Se usará para abrir un chat de WhatsApp cuando el cliente toque el ícono de teléfono.
                </p>
              </div>
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-medium text-slate-700">Correo de contacto</label>
                <input
                  type="email"
                  value={newPlaceEmail}
                  onChange={(e) => setNewPlaceEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-samsungBlue/20 focus:border-samsungBlue focus:bg-white focus:ring-2"
                  placeholder="Ej: promociones@samsung.com"
                />
                <p className="text-[11px] text-slate-500">
                  Se mostrará como correo de contacto y se abrirá el cliente de correo al tocar el ícono.
                </p>
              </div>
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-medium text-slate-700">Nombre del local Samsung</label>
                <input
                  type="text"
                  value={newPlaceStoreName}
                  onChange={(e) => setNewPlaceStoreName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-samsungBlue/20 focus:border-samsungBlue focus:bg-white focus:ring-2"
                  placeholder="Ej: Samsung Store"
                />
                <p className="text-[11px] text-slate-500">
                  Nombre que se mostrará dentro de la tarjeta del centro comercial.
                </p>
              </div>
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-medium text-slate-700">Dirección del local</label>
                <input
                  type="text"
                  value={newPlaceAddress}
                  onChange={(e) => setNewPlaceAddress(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-samsungBlue/20 focus:border-samsungBlue focus:bg-white focus:ring-2"
                  placeholder="Ej: Av. Principal y Calle 10, Local 25"
                />
                <p className="text-[11px] text-slate-500">
                  Dirección que se mostrará como referencia en la tarjeta.
                </p>
              </div>
              <div className="flex justify-end pt-1 text-xs">
                <button onClick={handleCreatePlace} className="btn-primary px-4 py-1.5">
                  {editingPlaceId ? "Actualizar lugar" : "Guardar lugar"}
                </button>
              </div>
            </div>

            <div className="max-h-64 space-y-1.5 overflow-auto rounded-lg border border-slate-100 bg-slate-50 p-2">
              {places.filter((p) => p.cityId === selectedCity.id).length === 0 && (
                <p className="text-xs text-slate-500">Aún no hay lugares en esta ciudad.</p>
              )}
              {places
                .filter((p) => p.cityId === selectedCity.id)
                .map((place) => (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => {
                      setEditingPlaceId(place.id);
                      setNewPlaceName(place.name || "");
                      setNewPlaceLocationUrl(place.locationUrl || "");
                      setNewPlacePhone(place.phone || "");
                      setNewPlaceEmail(place.email || "");
                      setNewPlaceStoreName(place.storeName || "");
                      setNewPlaceAddress(place.address || "");
                    }}
                    className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs hover:border-samsungBlue/60"
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

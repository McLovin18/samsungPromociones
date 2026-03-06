"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { addDoc, collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Place {
  id: string;
  name: string;
  cityId: string;
  cityName: string;
}

interface Promotion {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
}

export default function AdminPromotionsPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [search, setSearch] = useState("");

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [promoModalOpen, setPromoModalOpen] = useState(false);

  const [promotions, setPromotions] = useState<Promotion[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "places"), orderBy("name")), (snap) => {
      setPlaces(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedPlace) {
      setPromotions([]);
      return;
    }
    const unsub = onSnapshot(
      query(collection(db, "promotions"), where("placeId", "==", selectedPlace.id), orderBy("createdAt", "desc")),
      (snap) => {
        setPromotions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      }
    );
    return () => unsub();
  }, [selectedPlace]);

  const filteredPlaces = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return places;
    return places.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.cityName.toLowerCase().includes(term)
    );
  }, [search, places]);

  const handleOpenModal = (place: Place) => {
    setSelectedPlace(place);
    setPromoModalOpen(true);
  };

  const handleCreatePromotion = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPlace) return;
    const numericPrice = Number(price.replace(",", "."));
    await addDoc(collection(db, "promotions"), {
      title: title.trim(),
      description: description.trim(),
      price: numericPrice,
      imageUrl: imageUrl.trim(),
      placeId: selectedPlace.id,
      placeName: selectedPlace.name,
      cityId: selectedPlace.cityId,
      cityName: selectedPlace.cityName,
      active: true,
      createdAt: new Date(),
    });
    setTitle("");
    setDescription("");
    setPrice("");
    setImageUrl("");
  };

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Gestión de promociones
        </p>
        <h1 className="text-xl font-semibold text-slate-900">Crear promociones por punto</h1>
        <p className="text-xs text-slate-600 max-w-2xl">
          Elige un punto de venta, crea todas las promociones necesarias y se mostrarán automáticamente en la landing
          pública. No hay límite en la cantidad de promociones por lugar.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Inventario de lugares
            </p>
            <p className="text-xs text-slate-600">
              Busca por ciudad o lugar y haz clic para crear promociones.
            </p>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por ciudad o lugar…"
            className="w-full max-w-xs rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none ring-samsungBlue/20 focus:border-samsungBlue focus:bg-white focus:ring-2"
          />
        </div>

        <div className="max-h-[420px] space-y-1.5 overflow-auto rounded-xl border border-slate-100 bg-slate-50 p-2 text-xs">
          {filteredPlaces.length === 0 && (
            <p className="px-1 text-[11px] text-slate-500">No se encontraron lugares. Crea primero ciudades y puntos.</p>
          )}
          {filteredPlaces.map((place) => (
            <button
              key={place.id}
              onClick={() => handleOpenModal(place)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:border-samsungBlue/60"
            >
              <div>
                <p className="text-xs font-medium text-slate-800">{place.name}</p>
                <p className="text-[11px] text-slate-500">
                  {place.cityName} · Samsung Ecuador
                </p>
              </div>
              <span className="text-[11px] text-slate-500">Ver / crear promociones</span>
            </button>
          ))}
        </div>
      </section>

      {promoModalOpen && selectedPlace && (
        <PromoModal
          place={selectedPlace}
          onClose={() => {
            setPromoModalOpen(false);
            setSelectedPlace(null);
          }}
          promotions={promotions}
          onSubmit={handleCreatePromotion}
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          price={price}
          setPrice={setPrice}
          imageUrl={imageUrl}
          setImageUrl={setImageUrl}
        />
      )}
    </div>
  );
}

function PromoModal({
  place,
  onClose,
  promotions,
  onSubmit,
  title,
  setTitle,
  description,
  setDescription,
  price,
  setPrice,
  imageUrl,
  setImageUrl,
}: {
  place: Place;
  onClose: () => void;
  promotions: Promotion[];
  onSubmit: (e: FormEvent) => void;
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  price: string;
  setPrice: (v: string) => void;
  imageUrl: string;
  setImageUrl: (v: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="flex w-full max-w-5xl flex-col gap-4 rounded-2xl bg-white p-4 shadow-xl sm:flex-row">
        <div className="flex-1 space-y-3 border-b border-slate-100 pb-3 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Crear promoción
              </p>
              <p className="text-sm font-semibold text-slate-900">{place.name}</p>
              <p className="text-[11px] text-slate-500">
                {place.cityName} · Samsung Ecuador
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-3 text-xs">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-700">Nombre de la promoción</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none ring-samsungBlue/20 focus:border-samsungBlue focus:bg-white focus:ring-2"
                placeholder="Galaxy S24 con descuento especial"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-700">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none ring-samsungBlue/20 focus:border-samsungBlue focus:bg-white focus:ring-2"
                placeholder="Detalle breve de la promo, vigencia, condiciones claves…"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-700">Precio / valor referencia</label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none ring-samsungBlue/20 focus:border-samsungBlue focus:bg-white focus:ring-2"
                  placeholder="799.99"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-700">URL de imagen (opcional)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none ring-samsungBlue/20 focus:border-samsungBlue focus:bg-white focus:ring-2"
                  placeholder="https://…/promo.jpg"
                />
              </div>
            </div>
            <button type="submit" className="btn-primary mt-1 w-full justify-center text-xs">
              Guardar promoción
            </button>
            <p className="text-[10px] text-slate-500">
              Puedes crear tantas promociones como necesites para este punto. Se mostrarán como cards informativas al
              cliente final.
            </p>
          </form>
        </div>

        <div className="flex-1 space-y-2 text-xs">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Promociones actuales
          </p>
          <div className="max-h-[360px] space-y-2 overflow-auto rounded-xl border border-slate-100 bg-slate-50 p-2">
            {promotions.length === 0 && (
              <p className="px-1 text-[11px] text-slate-500">Aún no hay promociones para este punto.</p>
            )}
            {promotions.map((promo) => (
              <article key={promo.id} className="card flex gap-3 p-2">
                <div className="hidden h-16 w-16 flex-none overflow-hidden rounded-lg bg-slate-200 sm:block">
                  {promo.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={promo.imageUrl}
                      alt={promo.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-50">{promo.title}</p>
                  <p className="line-clamp-2 text-[11px] text-slate-200">{promo.description}</p>
                  <p className="mt-1 text-xs font-semibold text-samsungBlue">
                    ${promo.price.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { getDoc, setDoc } from "firebase/firestore";


import { DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, where, writeBatch } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "@/lib/firebase";
import { resolveImageUrl } from "@/lib/image-url";
import { storage } from "@/lib/firebase";

interface Place {
  id: string;
  name: string;
  cityId: string;
  cityName: string;
}

interface Promotion {
  id: string;
  sku?: string;
  title: string;
  originalPrice?: number | null; // precio del producto
  price?: number | null; // precio promocional
  imageUrl: string;
  order?: number;
  createdAt?: { seconds?: number; toDate?: () => Date } | Date | null;
}

function getPromotionCreatedAtMs(value: Promotion["createdAt"]) {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "object" && typeof value.toDate === "function") {
    return value.toDate().getTime();
  }
  if (typeof value === "object" && typeof value.seconds === "number") {
    return value.seconds * 1000;
  }
  return 0;
}

function sortPromotions(items: Promotion[]) {
  return [...items].sort((a, b) => {
    const orderA = typeof a.order === "number" ? a.order : Number.MAX_SAFE_INTEGER;
    const orderB = typeof b.order === "number" ? b.order : Number.MAX_SAFE_INTEGER;

    if (orderA !== orderB) return orderA - orderB;

    return getPromotionCreatedAtMs(b.createdAt) - getPromotionCreatedAtMs(a.createdAt);
  });
}

function reorderPromotions(items: Promotion[], draggedId: string, targetId: string | null) {
  const draggedPromotion = items.find((promo) => promo.id === draggedId);
  if (!draggedPromotion) return null;

  const nextItems = items.filter((promo) => promo.id !== draggedId);

  if (targetId === null) {
    nextItems.push(draggedPromotion);
    return nextItems;
  }

  const targetIndex = nextItems.findIndex((promo) => promo.id === targetId);
  if (targetIndex === -1) return null;

  nextItems.splice(targetIndex, 0, draggedPromotion);
  return nextItems;
}

export default function AdminPromotionsPage() {
    // Countdown settings
    const [countdownHours, setCountdownHours] = useState<number>(14);
    const [loadingCountdown, setLoadingCountdown] = useState(true);
    useEffect(() => {
      const fetchCountdown = async () => {
        try {
          const ref = doc(db, "settings", "countdown");
          const snap = await getDoc(ref);
          if (snap.exists()) {
            setCountdownHours(snap.data().hours || 14);
          }
        } catch (e) { console.error(e); }
        setLoadingCountdown(false);
      };
      fetchCountdown();
    }, []);

    const handleCountdownChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value);
      setCountdownHours(value);
      await setDoc(doc(db, "settings", "countdown"), { hours: value });
    };
  const [places, setPlaces] = useState<Place[]>([]);
  const [search, setSearch] = useState("");

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [promoModalOpen, setPromoModalOpen] = useState(false);

  const [promotions, setPromotions] = useState<Promotion[]>([]);

  const [sku, setSku] = useState("");
  const [title, setTitle] = useState("");
  const [previousPrice, setPreviousPrice] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [imageUrl, setImageUrl] = useState("");
  const [promotionImageFile, setPromotionImageFile] = useState<File | null>(null);
  const [editingPromotionId, setEditingPromotionId] = useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const normalizingPlaceIdRef = useRef<string | null>(null);

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
      query(collection(db, "promotions"), where("placeId", "==", selectedPlace.id)),
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Promotion[];
        const sortedItems = sortPromotions(items);
        setPromotions(sortedItems);

        if (
          items.some((promo) => typeof promo.order !== "number") &&
          normalizingPlaceIdRef.current !== selectedPlace.id
        ) {
          normalizingPlaceIdRef.current = selectedPlace.id;
          void (async () => {
            try {
              const batch = writeBatch(db);
              sortedItems.forEach((promo, index) => {
                batch.update(doc(db, "promotions", promo.id), { order: index });
              });
              await batch.commit();
            } catch (error) {
              console.error("Error normalizando el orden de promociones", error);
            } finally {
              normalizingPlaceIdRef.current = null;
            }
          })();
        }
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
    // al cambiar de lugar limpiamos estado de edición
    setEditingPromotionId(null);
    setSku("");
    setTitle("");
    setPreviousPrice("");
    setImageUrl("");
    setPromotionImageFile(null);
    setPromoModalOpen(true);
  };

  const handleCreatePromotion = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPlace) return;
    const numericPreviousPrice = Number(previousPrice.replace(",", "."));
    const numericPrice = Number(price.replace(",", "."));

    let finalImageUrl = imageUrl.trim();
    if (promotionImageFile) {
      const fileName = `promotion_${Date.now()}_${promotionImageFile.name}`;
      const storageRef = ref(storage, `promotion-images/${fileName}`);
      await uploadBytes(storageRef, promotionImageFile);
      finalImageUrl = await getDownloadURL(storageRef);
    }

    const payload = {
      sku: sku.trim(),
      title: title.trim(),
      originalPrice: Number.isNaN(numericPreviousPrice) ? null : numericPreviousPrice,
      price: Number.isNaN(numericPrice) ? null : numericPrice,
      imageUrl: finalImageUrl,
      placeId: selectedPlace.id,
      placeName: selectedPlace.name,
      cityId: selectedPlace.cityId,
      cityName: selectedPlace.cityName,
      active: true,
    };

    if (editingPromotionId) {
      await updateDoc(doc(db, "promotions", editingPromotionId), payload);
    } else {
      const nextOrder =
        promotions.reduce((maxOrder, promo) => {
          if (typeof promo.order !== "number") return maxOrder;
          return Math.max(maxOrder, promo.order);
        }, -1) + 1;

      await addDoc(collection(db, "promotions"), {
        ...payload,
        order: nextOrder,
        createdAt: new Date(),
      });
    }
    setSku("");
    setTitle("");
    setPreviousPrice("");
    setPrice("");
    setImageUrl("");
    setPromotionImageFile(null);
    setEditingPromotionId(null);
  };

  const handleEditPromotion = (promo: Promotion) => {
    setEditingPromotionId(promo.id);
    setSku(promo.sku || "");
    setTitle(promo.title);
    setPreviousPrice(
      typeof promo.originalPrice === "number"
        ? promo.originalPrice.toString()
        : ""
    );
    setPrice(
      typeof promo.price === "number"
        ? promo.price.toString()
        : ""
    );
    setImageUrl(promo.imageUrl || "");
    setPromotionImageFile(null);
  };

  const handleDeletePromotion = async (promo: Promotion) => {
    const confirmed = window.confirm(
      `¿Eliminar la promoción "${promo.title}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;
    await deleteDoc(doc(db, "promotions", promo.id));
    if (editingPromotionId === promo.id) {
      setEditingPromotionId(null);
      setSku("");
      setTitle("");
      setPreviousPrice("");
      setPrice("");
      setImageUrl("");
      setPromotionImageFile(null);
    }
  };

  const handleReorderPromotions = async (draggedId: string, targetId: string | null) => {
    const reorderedPromotions = reorderPromotions(promotions, draggedId, targetId);
    if (!reorderedPromotions) return;

    const previousPromotions = promotions;
    setPromotions(reorderedPromotions);
    setIsSavingOrder(true);

    try {
      const batch = writeBatch(db);
      reorderedPromotions.forEach((promo, index) => {
        batch.update(doc(db, "promotions", promo.id), { order: index });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error actualizando el orden de promociones", error);
      setPromotions(previousPromotions);
      window.alert("No se pudo guardar el nuevo orden. Intenta nuevamente.");
    } finally {
      setIsSavingOrder(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuración del contador */}

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
          onEdit={handleEditPromotion}
          onDelete={handleDeletePromotion}
          sku={sku}
          setSku={setSku}
          title={title}
          setTitle={setTitle}
          previousPrice={previousPrice}
          setPreviousPrice={setPreviousPrice}
          price={price}
          setPrice={setPrice}
          imageUrl={imageUrl}
          setImageUrl={setImageUrl}
          promotionImageFile={promotionImageFile}
          setPromotionImageFile={setPromotionImageFile}
          editingPromotionId={editingPromotionId}
          isSavingOrder={isSavingOrder}
          onReorder={handleReorderPromotions}
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
  sku,
  setSku,
  title,
  setTitle,
  previousPrice,
  setPreviousPrice,
  price,
  setPrice,
  imageUrl,
  setImageUrl,
  promotionImageFile,
  setPromotionImageFile,
  editingPromotionId,
  isSavingOrder,
  onReorder,
  onEdit,
  onDelete,
}: {
  place: Place;
  onClose: () => void;
  promotions: Promotion[];
  onSubmit: (e: FormEvent) => void;
  sku: string;
  setSku: (v: string) => void;
  title: string;
  setTitle: (v: string) => void;
  previousPrice: string;
  setPreviousPrice: (v: string) => void;
  price: string;
  setPrice: (v: string) => void;
  imageUrl: string;
  setImageUrl: (v: string) => void;
  promotionImageFile: File | null;
  setPromotionImageFile: (v: File | null) => void;
  editingPromotionId: string | null;
  isSavingOrder: boolean;
  onReorder: (draggedId: string, targetId: string | null) => Promise<void>;
  onEdit: (promo: Promotion) => void;
  onDelete: (promo: Promotion) => void;
}) {
  const [draggedPromotionId, setDraggedPromotionId] = useState<string | null>(null);
  const [dragOverPromotionId, setDragOverPromotionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDragStart = (event: DragEvent<HTMLElement>, promotionId: string) => {
    setDraggedPromotionId(promotionId);
    setDragOverPromotionId(promotionId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", promotionId);
  };

  const handleDragOver = (event: DragEvent<HTMLElement>, promotionId: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (draggedPromotionId !== promotionId) {
      setDragOverPromotionId(promotionId);
    }
  };

  const resetDragState = () => {
    setDraggedPromotionId(null);
    setDragOverPromotionId(null);
  };

  const handleDrop = async (event: DragEvent<HTMLElement>, targetId: string | null) => {
    event.preventDefault();

    if (!draggedPromotionId) {
      resetDragState();
      return;
    }

    const promotionId = event.dataTransfer.getData("text/plain") || draggedPromotionId;
    if (targetId !== null && promotionId === targetId) {
      resetDragState();
      return;
    }

    await onReorder(promotionId, targetId);
    resetDragState();
  };

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
              <label className="text-[11px] font-medium text-slate-700">SKU</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none ring-samsungBlue/20 focus:border-samsungBlue focus:bg-white focus:ring-2"
                placeholder="SM-S921BZKJ"
              />
            </div>
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
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-700">Precio del producto (original)</label>
                <input
                  type="text"
                  value={previousPrice}
                  onChange={(e) => setPreviousPrice(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none ring-samsungBlue/20 focus:border-samsungBlue focus:bg-white focus:ring-2"
                  placeholder="899.99"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-700">Precio promocional</label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none ring-samsungBlue/20 focus:border-samsungBlue focus:bg-white focus:ring-2"
                  placeholder="699.99"
                />
              </div>
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
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 inline-flex items-center justify-center rounded-lg border border-samsungBlue/40 bg-samsungBlue/10 px-3 py-2 text-[11px] font-semibold text-samsungBlue hover:bg-samsungBlue/15"
              >
                Subir desde el dispositivo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setPromotionImageFile(file);
                  if (file) {
                    setImageUrl("");
                  }
                }}
              />
              {promotionImageFile ? (
                <p className="text-[10px] text-slate-500">Archivo seleccionado: {promotionImageFile.name}</p>
              ) : (
                <p className="text-[10px] text-slate-500">
                  También puedes pegar un enlace si prefieres.
                </p>
              )}
            </div>
            <button type="submit" className="btn-primary mt-1 w-full justify-center text-xs">
              {editingPromotionId ? "Actualizar promoción" : "Guardar promoción"}
            </button>
            <p className="text-[10px] text-slate-500">
              Puedes crear tantas promociones como necesites para este punto. Se mostrarán como cards informativas al
              cliente final.
            </p>
          </form>
        </div>

        <div className="flex-1 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Promociones actuales
            </p>
            <p className="text-[10px] text-slate-500">
              {isSavingOrder ? "Guardando orden..." : "Arrastra para reordenar"}
            </p>
          </div>
          <div className="max-h-[360px] space-y-2 overflow-auto rounded-xl border border-slate-100 bg-slate-50 p-2">
            {promotions.length === 0 && (
              <p className="px-1 text-[11px] text-slate-500">Aún no hay promociones para este punto.</p>
            )}
            {promotions.map((promo) => (
              <article
                key={promo.id}
                draggable
                onClick={() => onEdit(promo)}
                onDragStart={(event) => handleDragStart(event, promo.id)}
                onDragOver={(event) => handleDragOver(event, promo.id)}
                onDrop={(event) => void handleDrop(event, promo.id)}
                onDragEnd={resetDragState}
                className={`card flex gap-3 p-2 cursor-pointer hover:border-samsungBlue/60 ${
                  draggedPromotionId === promo.id ? "opacity-60" : ""
                } ${dragOverPromotionId === promo.id ? "border-samsungBlue ring-2 ring-samsungBlue/20" : ""}`}
              >
                <div className="hidden h-16 w-16 flex-none overflow-hidden rounded-lg bg-slate-200 sm:block">
                  {resolveImageUrl(promo.imageUrl) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveImageUrl(promo.imageUrl)}
                      alt={promo.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-50">{promo.title}</p>
                  <div className="mt-1 flex flex-col items-start gap-1 text-xs">
                    {typeof promo.originalPrice === "number" && (
                      <span className="line-through text-slate-400 text-[10px]">
                        $
                        {promo.originalPrice.toLocaleString("es-EC", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    )}
                    {typeof promo.price === "number" && (
                      <span className="font-bold text-samsungBlue">
                        $
                        {promo.price.toLocaleString("es-EC", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(promo);
                  }}
                  className="self-start rounded-full border border-red-300 px-2 py-0.5 text-[10px] text-red-500 hover:bg-red-50"
                >
                  Eliminar
                </button>
              </article>
            ))}
            {promotions.length > 1 && draggedPromotionId && (
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDragOverPromotionId(null);
                }}
                onDrop={(event) => void handleDrop(event, null)}
                className="rounded-lg border border-dashed border-slate-300 bg-white/70 px-3 py-2 text-center text-[11px] text-slate-500"
              >
                Suelta aquí para moverla al final
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

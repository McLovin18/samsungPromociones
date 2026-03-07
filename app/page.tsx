"use client";
import NewsletterSection from "./components/NewsletterSection";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import PromoCarousel from "./components/PromoCarousel";

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
}

interface Promotion {
  id: string;
  title: string;
  description: string;
  price: number; // precio promocional
  originalPrice?: number | null; // precio antes de la promo
  imageUrl: string;
}

export default function HomePage() {
    const [showShareModal, setShowShareModal] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>("");

  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [loadingPromotions, setLoadingPromotions] = useState(false);

  useEffect(() => {
    const loadCities = async () => {
      setLoadingCities(true);
      try {
        const ref = collection(db, "cities");
        const snap = await getDocs(ref);
        const items: City[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setCities(items);
      } catch (error) {
        console.error("Error cargando ciudades", error);
      } finally {
        setLoadingCities(false);
      }
    };

    loadCities();
  }, []);

  const selectedCity = useMemo(
    () => cities.find((c) => c.id === selectedCityId),
    [cities, selectedCityId]
  );

  useEffect(() => {
    if (!selectedCityId) {
      setPlaces([]);
      setSelectedPlaceId("");
      setPromotions([]);
      return;
    }

    const loadPlaces = async () => {
      setLoadingPlaces(true);
      try {
        const ref = collection(db, "places");
        const q = query(ref, where("cityId", "==", selectedCityId));
        const snap = await getDocs(q);
        const items: Place[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setPlaces(items);
      } catch (error) {
        console.error("Error cargando lugares", error);
      } finally {
        setLoadingPlaces(false);
      }
    };

    loadPlaces();
  }, [selectedCityId]);

  useEffect(() => {
    if (!selectedPlaceId) {
      setPromotions([]);
      return;
    }

    const loadPromotions = async () => {
      setLoadingPromotions(true);
      try {
        const ref = collection(db, "promotions");
        const q = query(ref, where("placeId", "==", selectedPlaceId));
        const snap = await getDocs(q);
        const items: Promotion[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setPromotions(items);
      } catch (error) {
        console.error("Error cargando promociones", error);
      } finally {
        setLoadingPromotions(false);
      }
    };

    loadPromotions();
  }, [selectedPlaceId]);

  const selectedPlace = useMemo(
    () => places.find((p) => p.id === selectedPlaceId) ?? null,
    [places, selectedPlaceId]
  );

  const getWhatsAppUrl = (phone: string) => {
    const cleaned = phone.replace(/[^0-9]/g, "");
    if (!cleaned) return "#";
    return `https://wa.me/${cleaned}`;
  };

  return (
  <div className="space-y-10 w-full">
    {/* Selección de ciudad */}
    <section className="mx-auto w-full rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 shadow-xl shadow-black/40">
      <div className="space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
          Samsung Ecuador
        </p>
        <p className="text-lg font-semibold text-white">Selecciona tu ciudad</p>
        <div className="space-y-3">
          <select
            className="w-full rounded-lg border border-slate-700 bg-white px-3 py-2.5 text-base text-slate-900 outline-none ring-samsungBlue/30 focus:border-samsungBlue focus:ring-2"
            value={selectedCityId}
            onChange={(e) => setSelectedCityId(e.target.value)}
          >
            <option value="">Selecciona tu ciudad</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
          {loadingCities && <p className="text-sm text-slate-300">Cargando ciudades…</p>}
          <button
            type="button"
            className="btn-primary w-full justify-center text-sm"
            disabled={!selectedCityId}
          >
            Buscar promociones
          </button>
        </div>
      </div>
    </section>

    {/* Selección de lugar */}
    <section className="space-y-4 rounded-3xl bg-slate-950/60 p-4 sm:p-6">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold text-slate-50">
          Elige tu centro comercial más cercano
        </h2>
        <p className="text-sm text-slate-300">
          Selecciona el local que prefieres visitar:
        </p>
      </div>

      {!selectedCityId && (
        <p className="text-center text-sm text-slate-400">
          Primero selecciona una ciudad para ver los centros comerciales disponibles.
        </p>
      )}

      {selectedCityId && !loadingPlaces && places.length === 0 && (
        <p className="text-center text-sm text-slate-400">
          Por ahora no hay centros comerciales configurados para esta ciudad.
        </p>
      )}

      {selectedCityId && places.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {places.map((place) => (
            <article
              key={place.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 shadow-md shadow-black/30"
            >
              <header className="border-b border-slate-700 pb-2 text-center">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-50">
                  {place.name}
                </h3>
              </header>
              <div className="space-y-1.5 py-3 text-sm text-slate-200">
                <p>• {place.storeName || "Samsung Store"}</p>
                {place.address && <p className="italic">• {place.address}</p>}
              </div>
              <div className="pt-1 pb-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlaceId(place.id);
                    if (typeof document !== "undefined") {
                      const el = document.getElementById("promociones");
                      el?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                  className={`inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-semibold shadow-md transition ${
                    selectedPlaceId === place.id
                      ? "bg-samsungBlue text-white shadow-samsungBlue/40"
                      : "bg-samsungBlue/90 text-white hover:bg-samsungBlue"
                  }`}
                >
                  Ver promociones
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>

    {/* Promociones */}
    <section
        id="promociones"
        className="space-y-6 w-full rounded-3xl border border-slate-800/80 bg-slate-900/80 p-4 shadow-2xl shadow-black/40 sm:p-6"
      >
        {/* Sección QR para validar promoción */}
        <div className="flex flex-col items-center justify-center mb-4">
          {/* QR y botón compartir */}
          <img
            src="/imagenPromocion.jpeg"
            alt="Código QR para validar promoción"
            className="w-32 h-32 rounded-lg border border-slate-700 bg-white p-2 shadow-md cursor-pointer"
            id="promo-qr-img"
            onClick={() => setShowShareModal(true)}
          />
          <button
            type="button"
            className="mt-2 px-4 py-2 rounded-lg bg-samsungBlue text-white font-semibold text-xs shadow-md hover:bg-samsungBlue/80 transition"
            onClick={() => setShowShareModal(true)}
          >
            Compartir imagen
          </button>
          <p className="mt-2 text-xs text-slate-300 text-center">
            Presenta este código QR en el local para validar tu promoción.<br />
            También puedes compartir la imagen por redes sociales para que otros la usen.
          </p>
          {/* Modal de compartir */}
          {showShareModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
              <div className="bg-slate-900 rounded-xl p-6 shadow-2xl flex flex-col items-center gap-4">
                <p className="text-sm text-slate-200 font-semibold">Compartir imagen por:</p>
                <div className="flex flex-row gap-4">
                  <button
                    type="button"
                    className="flex flex-col items-center justify-center gap-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 p-2 shadow-md text-white transition"
                    title="WhatsApp"
                    onClick={() => {
                      const url = `${window.location.origin}/qr-demo.png`;
                      window.open(`https://wa.me/?text=¡Usa este código QR para promociones Samsung! ${url}`);
                      setShowShareModal(false);
                    }}
                  >
                    <WhatsAppIcon className="h-6 w-6" />
                    <span className="text-xs font-medium">WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    className="flex flex-col items-center justify-center gap-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 p-2 shadow-md text-white transition"
                    title="Facebook"
                    onClick={() => {
                      const url = `${window.location.origin}/qr-demo.png`;
                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
                      setShowShareModal(false);
                    }}
                  >
                    <FacebookIcon className="h-6 w-6" />
                    <span className="text-xs font-medium">Facebook</span>
                  </button>
                  <button
                    type="button"
                    className="flex flex-col items-center justify-center gap-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 p-2 shadow-md text-white transition"
                    title="X/Twitter"
                    onClick={() => {
                      const url = `${window.location.origin}/qr-demo.png`;
                      window.open(`https://twitter.com/intent/tweet?text=¡Usa este código QR para promociones Samsung!&url=${encodeURIComponent(url)}`);
                      setShowShareModal(false);
                    }}
                  >
                    <TwitterIcon className="h-6 w-6" />
                    <span className="text-xs font-medium">X/Twitter</span>
                  </button>
                  <button
                    type="button"
                    className="flex flex-col items-center justify-center gap-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 p-2 shadow-md text-white transition"
                    title="Instagram"
                    onClick={() => {
                      alert('Instagram solo permite compartir imágenes por mensaje directo o historia. Descarga la imagen y compártela manualmente.');
                      setShowShareModal(false);
                    }}
                  >
                    <InstagramIcon className="h-6 w-6" />
                    <span className="text-xs font-medium">Instagram</span>
                  </button>
                </div>
                <button
                  type="button"
                  className="mt-2 px-4 py-2 rounded-lg bg-slate-700 text-white font-semibold text-xs shadow-md hover:bg-slate-800 transition"
                  onClick={() => setShowShareModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
    
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-base text-slate-200 flex flex-wrap items-center gap-2">
            <span className="font-medium">
              {selectedCity ? selectedCity.name : ""}
            </span>
            {selectedPlace && (
              <>
                <span className="text-slate-400">· {selectedPlace.name}</span>
                {selectedPlace.locationUrl && (
                  <a
                    href={selectedPlace.locationUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-samsungBlue/20 bg-white/80 px-2.5 py-0.5 text-[11px] font-medium text-samsungBlue hover:bg-samsungBlue hover:text-white transition"
                  >
                    <GoogleMapsIcon className="h-4 w-4 text-samsungBlue" />
                    Ubicación
                  </a>
                )}
              </>
            )}
          </p>
        </div>
      </div>

      {/* Layout de promociones + iconos */}
      <div className="flex w-full gap-4">
        {/* Productos promocionales: 80% */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 w-4/5">
          {loadingPromotions && <p className="text-sm text-slate-400">Cargando promociones…</p>}
          {!loadingPromotions && selectedPlaceId && promotions.length === 0 && (
            <p className="text-sm text-slate-400">
              Por ahora no hay promociones configuradas para este lugar.
            </p>
          )}
          {promotions.map((promo) => (
            <article key={promo.id} className="card overflow-hidden w-full">
              <div className="aspect-[4/3] w-full bg-slate-800">
                {promo.imageUrl && (
                  <img
                    src={promo.imageUrl}
                    alt={promo.title}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="space-y-2 p-3">
                <h3 className="text-base font-semibold text-slate-50 line-clamp-2">
                  {promo.title}
                </h3>
                <p className="text-sm text-slate-300 line-clamp-3">{promo.description}</p>
                <div className="pt-1 flex items-baseline gap-2">
                  {typeof promo.originalPrice === "number" && (
                    <span className="text-sm text-slate-400 line-through">
                      ${promo.originalPrice
                        .toLocaleString("es-EC", {
                          style: "currency",
                          currency: "USD",
                        })
                        .replace("US$", "")}
                    </span>
                  )}
                  <span className="text-xl font-semibold text-white">
                    ${promo.price
                      .toLocaleString("es-EC", {
                        style: "currency",
                        currency: "USD",
                      })
                      .replace("US$", "")}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Promoción informativa. Presenta esta oferta en el punto de venta.
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Iconos de redes sociales: 20% */}
        {selectedPlace && (
          <aside className="w-1/5 flex flex-col gap-4 items-center justify-start">
            <SocialButton icon={<FacebookIcon className="h-8 w-8" />} label="Facebook" onClick={() => handleSocialShare('facebook', selectedPlace)} />
            <SocialButton icon={<InstagramIcon className="h-8 w-8" />} label="Instagram" onClick={() => handleSocialShare('instagram', selectedPlace)} />
            <SocialButton icon={<TwitterIcon className="h-8 w-8" />} label="X/Twitter" onClick={() => handleSocialShare('twitter', selectedPlace)} />
            <SocialButton icon={<WhatsAppIcon className="h-8 w-8" />} label="WhatsApp" onClick={() => handleSocialShare('whatsapp', selectedPlace)} />
          </aside>
        )}
      </div>

      {/* Contacto del punto de venta */}
      {selectedPlace && (selectedPlace.phone || selectedPlace.email) && (
        <div className="mt-3 border-t border-slate-800/70 pt-3 text-xs text-slate-300 flex flex-wrap items-center gap-3">
          <span className="text-[11px] text-slate-400">Contacto del punto de venta</span>
          <div className="flex flex-wrap gap-2">
            {selectedPlace.locationUrl && (
              <a
                href={selectedPlace.locationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-samsungBlue/30 bg-white/80 text-samsungBlue hover:bg-samsungBlue hover:text-white transition"
              >
                <GoogleMapsIcon className="h-5 w-5" />
              </a>
            )}
            {selectedPlace.phone && (
              <a
                href={`tel:${selectedPlace.phone}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sky-400/60 bg-white/80 text-sky-500 hover:bg-sky-500 hover:text-white transition"
              >
                <PhoneOfficialIcon className="h-5 w-5" />
              </a>
            )}
            {selectedPlace.phone && (
              <a
                href={getWhatsAppUrl(selectedPlace.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400/60 bg-white/80 text-emerald-500 hover:bg-emerald-500 hover:text-white transition"
              >
                <WhatsAppIcon className="h-5 w-5" />
              </a>
            )}
            {selectedPlace.email && (
              <a
                href={`mailto:${selectedPlace.email}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-samsungBlue/60 bg-white/80 text-samsungBlue hover:bg-samsungBlue hover:text-white transition"
              >
                <MailIcon className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      )}
    </section>

    <PromoCarousel />
    <NewsletterSection/>
  </div>
);
};


        // Botón de red social
        function SocialButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
          return (
            <button
              type="button"
              className="flex flex-col items-center justify-center gap-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 p-2 shadow-md text-white transition"
              onClick={onClick}
              title={label}
            >
              {icon}
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        }

        // Iconos oficiales
        function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
          return (
            <svg viewBox="0 0 24 24" fill="none" {...props}>
              <circle cx="12" cy="12" r="12" fill="#1877F3" />
              <path d="M15.5 8.5H14V7.5C14 7.22 14.22 7 14.5 7H15.5V5H14.5C13.12 5 12 6.12 12 7.5V8.5H10.5V10.5H12V17H14V10.5H15.5V8.5Z" fill="#fff" />
            </svg>
          );
        }
        function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
          return (
            <svg viewBox="0 0 24 24" fill="none" {...props}>
              <circle cx="12" cy="12" r="12" fill="#E1306C" />
              <rect x="7" y="7" width="10" height="10" rx="3" fill="#fff" />
              <circle cx="12" cy="12" r="3" fill="#E1306C" />
              <circle cx="16" cy="8" r="1" fill="#E1306C" />
            </svg>
          );
        }
        function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
          return (
            <svg viewBox="0 0 24 24" fill="none" {...props}>
              <circle cx="12" cy="12" r="12" fill="#1DA1F2" />
              <path d="M19 8.5c-.5.2-1 .4-1.5.5.5-.3.9-.8 1-1.4-.5.3-1 .6-1.6.7-.5-.5-1.2-.8-2-.8-1.5 0-2.7 1.2-2.7 2.7 0 .2 0 .4.1.6-2.2-.1-4.1-1.2-5.4-2.9-.2.3-.3.7-.3 1.1 0 .9.5 1.7 1.2 2.1-.5 0-.9-.2-1.3-.4v.1c0 1.3.9 2.3 2.1 2.5-.2.1-.5.1-.7.1-.2 0-.3 0-.5-.1.3 1 1.2 1.7 2.2 1.7-1 .8-2.2 1.2-3.5 1.2-.2 0-.4 0-.6-.1C6.5 17 8.2 17.5 10 17.5c4.2 0 6.5-3.5 6.5-6.5v-.3c.4-.3.8-.7 1-1.2z" fill="#fff" />
            </svg>
          );
        }

        // Manejo de publicación
        function handleSocialShare(network: string, place: Place | null) {
          if (!place) return;
          let url = "";
          const text = encodeURIComponent(`¡Visita ${place.name} en ${place.cityName}!`);
          switch (network) {
            case "facebook":
              url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(place.locationUrl || "https://shop.samsung.com/latin/ecu/ec")}`;
              break;
            case "instagram":
              alert("Instagram no permite compartir directamente desde web. Copia el texto y publícalo en la app.");
              return;
            case "twitter":
              url = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(place.locationUrl || "https://shop.samsung.com/latin/ecu/ec")}`;
              break;
            case "whatsapp":
              url = `https://wa.me/?text=${text}%20${encodeURIComponent(place.locationUrl || "https://shop.samsung.com/latin/ecu/ec")}`;
              break;
            default:
              return;
          }
          window.open(url, '_blank');
        }




function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.68 14.91 16.08 14.82 16.43 14.94C17.55 15.31 18.75 15.51 20 15.51C20.55 15.51 21 15.96 21 16.51V20C21 20.55 20.55 21 20 21C11.72 21 5 14.28 5 6C5 5.45 5.45 5 6 5H9.5C10.05 5 10.5 5.45 10.5 6C10.5 7.25 10.7 8.45 11.07 9.57C11.18 9.92 11.1 10.32 10.82 10.6L8.62 12.8L6.62 10.79Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5 7L11.4 11.2C11.76 11.44 12.24 11.44 12.6 11.2L19 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Icono Google Maps oficial
function GoogleMapsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="12" cy="12" r="10" fill="#fff" />
      <path d="M12 2C7.03 2 3 6.03 3 11c0 4.97 4.03 9 9 9s9-4.03 9-9c0-4.97-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7 0-3.86 3.14-7 7-7 3.86 0 7 3.14 7 7 0 3.86-3.14 7-7 7z" fill="#4285F4" />
      <path d="M12 6.5c-2.48 0-4.5 2.02-4.5 4.5s2.02 4.5 4.5 4.5 4.5-2.02 4.5-4.5-2.02-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5S10.62 8.5 12 8.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#EA4335" />
    </svg>
  );
}

// Icono teléfono oficial
function PhoneOfficialIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.68 14.91 16.08 14.82 16.43 14.94C17.55 15.31 18.75 15.51 20 15.51C20.55 15.51 21 15.96 21 16.51V20C21 20.55 20.55 21 20 21C11.72 21 5 14.28 5 6C5 5.45 5.45 5 6 5H9.5C10.05 5 10.5 5.45 10.5 6C10.5 7.25 10.7 8.45 11.07 9.57C11.18 9.92 11.1 10.32 10.82 10.6L8.62 12.8L6.62 10.79Z" fill="#1976D2" />
    </svg>
  );
}

// Icono WhatsApp oficial
function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="12" cy="12" r="10" fill="#25D366" />
      <path d="M17.472 14.382c-.297-.149-1.758-.868-2.031-.967-.273-.099-.472-.148-.671.149-.198.297-.767.967-.941 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.447-.521.149-.173.198-.297.298-.495.099-.198.05-.372-.025-.521-.074-.149-.671-1.611-.921-2.207-.242-.579-.487-.5-.671-.51-.173-.009-.372-.011-.571-.011-.198 0-.521.074-.793.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.066 2.875 1.216 3.074.149.198 2.099 3.209 5.077 4.504.711.306 1.263.489 1.697.626.713.227 1.36.195 1.872.118.571-.085 1.758-.719 2.008-1.413.25-.694.25-1.289.173-1.413-.074-.124-.272-.198-.569-.347z" fill="#fff" />
    </svg>
  );
}

// Icono email oficial
function MailOfficialIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" fill="#EA4335" />
      <path d="M5 7L11.4 11.2C11.76 11.44 12.24 11.44 12.6 11.2L19 7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
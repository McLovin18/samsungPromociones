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
  image?: string | null;
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
      <div className="flex flex-col xl:flex-row w-full gap-4">
        {/* Imagen promocional del local: 20% en desktop, arriba en móvil */}
        {selectedPlace && selectedPlace.image && (
          <div className="flex flex-col items-center justify-start xl:w-1/5 w-full mb-4 xl:mb-0">
            <img
              src={selectedPlace.image}
              alt="Imagen promocional del local"
              className="w-40 h-40 rounded-lg border border-slate-700 bg-white p-2 shadow-md object-contain"
            />
            <button
              type="button"
              className="mt-2 px-4 py-2 rounded-lg bg-samsungBlue text-white font-semibold text-xs shadow-md hover:bg-samsungBlue/80 transition"
              onClick={async () => {
                try {
                  const response = await fetch(selectedPlace.image!);
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'promocion-local.png';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                } catch (error) {
                  console.error('Error descargando imagen:', error);
                  window.open(selectedPlace.image!, '_blank');
                }
              }}
            >
              Descargar imagen
            </button>
            <p className="mt-8 text-xs text-slate-300 text-center leading-relaxed max-w-[180px]">
              Presenta el cupón que descargaste en el local que seleccionaste para obtener tu descuento.
            </p>
          </div>
        )}
        {/* Productos promocionales: 60% en desktop */}
        <div className="xl:w-3/5 w-full grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
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

        {/* Iconos de redes sociales: 20% en desktop, fila horizontal en móvil */}
        {selectedPlace && (
          <aside className="xl:w-1/5 w-full mt-4 xl:mt-0 xl:flex xl:flex-col xl:items-center xl:justify-start xl:gap-4 flex flex-col gap-2 items-center">
            <p className="text-sm font-semibold text-slate-300 mb-2 xl:mb-0">Compartir promoción</p>
            <div className="flex flex-row xl:flex-col gap-3 xl:gap-4">
              <SocialButton icon={<FacebookIcon className="h-5 w-5" />} label="Facebook" onClick={() => handleSocialShare('facebook', selectedPlace)} />
              <SocialButton icon={<XIcon className="h-5 w-5" />} label="X" onClick={() => handleSocialShare('twitter', selectedPlace)} />
              <SocialButton icon={<InstagramIcon className="h-5 w-5" />} label="Instagram" onClick={() => handleSocialShare('instagram', selectedPlace)} />
              <SocialButton icon={<WhatsAppIcon className="h-5 w-5" />} label="WhatsApp" onClick={() => handleSocialShare('whatsapp', selectedPlace)} />
              <SocialButton icon={<TelegramIcon className="h-5 w-5" />} label="Telegram" onClick={() => handleSocialShare('telegram', selectedPlace)} />
            </div>
          </aside>
        )}
      </div>

      {/* Contacto del punto de venta */}
      {selectedPlace && (selectedPlace.phone || selectedPlace.email) && (
        <div className="mt-4 border-t border-slate-800/70 pt-4 flex flex-col items-center xl:items-start gap-3">
          <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">Contacto del punto de venta</span>
          <div className="flex flex-wrap justify-center xl:justify-start gap-3">
            {selectedPlace.locationUrl && (
              <a
                href={selectedPlace.locationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-600 bg-transparent text-slate-300 transition hover:border-slate-400 hover:text-white"
                title="Ver ubicación"
              >
                <GoogleMapsIcon className="h-5 w-5" />
              </a>
            )}
            {selectedPlace.phone && (
              <a
                href={`tel:${selectedPlace.phone}`}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-600 bg-transparent text-slate-300 transition hover:border-slate-400 hover:text-white"
                title="Llamar"
              >
                <PhoneContactIcon className="h-5 w-5" />
              </a>
            )}
            {selectedPlace.phone && (
              <a
                href={getWhatsAppUrl(selectedPlace.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-600 bg-transparent text-slate-300 transition hover:border-slate-400 hover:text-white"
                title="WhatsApp"
              >
                <WhatsAppContactIcon className="h-5 w-5" />
              </a>
            )}
            {selectedPlace.email && (
              <a
                href={`mailto:${selectedPlace.email}`}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-600 bg-transparent text-slate-300 transition hover:border-slate-400 hover:text-white"
                title="Enviar email"
              >
                <MailContactIcon className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      )}
    </section>

    <PromoCarousel />
    <NewsletterSection/>
    
    {/* Footer del desarrollador */}
    <footer className="mt-8 border-t border-slate-800/50 pt-6 pb-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} Promociones Samsung Ecuador. Todos los derechos reservados.
        </p>
        <a 
          href="https://grupoecualink.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 rounded-full border border-slate-700/50 bg-slate-900/60 px-4 py-2 text-xs text-slate-400 transition hover:border-samsungBlue/50 hover:bg-slate-800/80 hover:text-slate-200"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
          Sitio web desarrollado por 
          <span className="font-semibold text-samsungBlue group-hover:text-white transition">Grupo EcuaLink</span>
        </a>
      </div>
    </footer>
  </div>
);
};


        // Botón de red social - estilo minimalista circular
        function SocialButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
          return (
            <button
              type="button"
              className="flex items-center justify-center h-12 w-12 rounded-full border border-slate-600 bg-transparent hover:border-slate-400 text-slate-300 hover:text-white transition"
              onClick={onClick}
              title={label}
            >
              {icon}
            </button>
          );
        }

        // Iconos minimalistas
        function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
          return (
            <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2z" />
            </svg>
          );
        }
        function XIcon(props: React.SVGProps<SVGSVGElement>) {
          return (
            <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          );
        }
        function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
          return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          );
        }
        function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
          return (
            <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          );
        }
        function TelegramIcon(props: React.SVGProps<SVGSVGElement>) {
          return (
            <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
          );
        }

        // Manejo de publicación
        function handleSocialShare(network: string, place: Place | null) {
          if (!place) return;
          let url = "";
          const text = encodeURIComponent(`¡Descubre las mejores promociones Samsung en ${place.name}, ${place.cityName}!`);
          const shareUrl = "https://www.samsungecuador.com";
          switch (network) {
            case "facebook":
              url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
              break;
            case "instagram":
              alert("Instagram no permite compartir directamente desde web. Copia el texto y publícalo en la app.");
              return;
            case "twitter":
              url = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`;
              break;
            case "whatsapp":
              url = `https://wa.me/?text=${text}%20${encodeURIComponent(shareUrl)}`;
              break;
            case "linkedin":
              url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
              break;
            case "telegram":
              url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`;
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

// Icono ubicación - minimalista outline
function GoogleMapsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

// Icono teléfono contacto - minimalista
function PhoneContactIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    </svg>
  );
}

// Icono WhatsApp contacto - minimalista
function WhatsAppContactIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// Icono email contacto - minimalista
function MailContactIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
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

// Icono email oficial
function MailOfficialIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" fill="#EA4335" />
      <path d="M5 7L11.4 11.2C11.76 11.44 12.24 11.44 12.6 11.2L19 7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
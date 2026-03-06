"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  {
    src: "/promo1.jpeg",
    alt: "Promoción Samsung 1",
    href: "https://shop.samsung.com/latin/ecu/ec/unpacked",
  },
  {
    src: "/promo2.jpeg",
    alt: "Promoción Samsung 2",
    href: "https://shop.samsung.com/latin/ecu/ec/samsung-care-plus",
  },
  {
    src: "/promo3.jpeg",
    alt: "Promoción Samsung 3",
    href: "https://shop.samsung.com/latin/ecu/ec/sorprendete",
  },
  {
    src: "/promo4.png",
    alt: "Promoción Samsung 4",
    href: "https://shop.samsung.com/latin/ecu/ec/shop/tv-av.html",
  },
];

export default function PromoCarousel() {
  const [current, setCurrent] = useState(0);
  const total = slides.length;

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, 3000);
    return () => clearInterval(id);
  }, [total]);

  const goTo = (index: number) => {
    if (index < 0) {
      setCurrent(total - 1);
    } else if (index >= total) {
      setCurrent(0);
    } else {
      setCurrent(index);
    }
  };

  // Mostrar dos imágenes consecutivas en desktop, una en móvil
  return (
    <section className="mt-10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="relative">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {[0, 1].map((offset) => {
              // En móvil solo la primera imagen
              if (offset === 1 && typeof window !== "undefined" && window.innerWidth < 1024) return null;
              const idx = (current + offset) % total;
              const slide = slides[idx];
              return (
                <div
                  key={slide.src}
                  className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/80 shadow-2xl shadow-black/40 flex items-center justify-center"
                >
                  <a href={slide.href} className="block">
                    <Image
                      src={slide.src}
                      alt={slide.alt}
                      width={700}
                      height={700}
                      className="object-contain max-w-full max-h-[700px]"
                      priority={offset === 0}
                    />
                  </a>
                </div>
              );
            })}
          </div>
          {/* ...existing code... */}
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => goTo(current - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-slate-100 hover:bg-black/70"
          >
            <span className="sr-only">Anterior</span>
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 6L9 12L15 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => goTo(current + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-slate-100 hover:bg-black/70"
          >
            <span className="sr-only">Siguiente</span>
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 6L15 12L9 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => goTo(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === current ? "w-6 bg-samsungBlue" : "w-2 bg-slate-500/60"
                }`}
                aria-label={`Ir al slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

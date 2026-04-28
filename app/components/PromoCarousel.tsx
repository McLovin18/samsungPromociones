"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
    {
    src: "/promo3.jpeg",
    alt: "Promoción Samsung 1",
  },
  {
    src: "/promo_1.jpeg",
    alt: "Promoción Samsung 2",
  },
  {
    src: "/promo2.png",
    alt: "Promoción Samsung 3",
  },
  {
    src: "/promo4.jpg",
    alt: "Promoción Samsung 4",
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

  // Mostrar una imagen a la vez
  return (
    <section className="mt-2">
      <div className="mx-auto max-w-6xl px-4">
        <div className="relative">
          <div className="flex justify-center">
            <div
              className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/80 shadow-2xl shadow-black/40 flex items-center justify-center w-full max-w-2xl"
            >
              <a href={slides[current].href} className="block w-full">
                <Image
                  src={slides[current].src}
                  alt={slides[current].alt}
                  width={1000}
                  height={500}
                  className="object-contain w-full h-auto"
                  priority
                />
              </a>
            </div>
          </div>
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

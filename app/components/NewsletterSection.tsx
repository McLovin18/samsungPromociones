"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import Script from "next/script";
import { db } from "@/lib/firebase";

interface City {
  id: string;
  name: string;
}

export default function NewsletterSection() {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState("");

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
  }, []);

  return (
    <section className="w-full py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 text-center space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Mantente informado
          </p>
          <h2 className="text-xl font-semibold text-slate-50">
            Suscríbete para recibir las últimas promociones Samsung
          </h2>
        </div>

        <div className="mt-6 flex justify-center">
          <div
            id="sp-form-252239"
            sp-id="252239"
            sp-hash="53256e582af8cb8b312e85b5d1a4bedd7063fc090c7b1ceddcac3173d3843f43"
            sp-lang="es-mx"
            className="sp-form sp-form-regular sp-form-embed sp-form-horizontal"
          >
            <div className="sp-form-fields-wrapper">
              <div className="sp-message">
                <div></div>
              </div>

              <form className="sp-element-container sp-lg">
                <div className="sp-field">
                  <label className="sp-control-label">
                    <span>Tu nombre</span> <strong>*</strong>
                  </label>
                  <input
                    type="text"
                    name="sform[Tm9tYnJl]"
                    className="sp-form-control"
                    placeholder="Nombre completo"
                    autoComplete="on"
                    required
                  />
                </div>

                <div className="sp-field">
                  <label className="sp-control-label">
                    <span>Ciudad</span> <strong>*</strong>
                  </label>
                  <select
                    name="sform[Z2RwckNvbmZpcm0=]"
                    className="sp-form-control"
                    required
                    value={selectedCityId}
                    onChange={(e) => setSelectedCityId(e.target.value)}
                  >
                    <option value="" disabled>
                      Selecciona tu ciudad
                    </option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sp-field">
                  <label className="sp-control-label">
                    <span>Correo</span> <strong>*</strong>
                  </label>
                  <input
                    type="email"
                    name="sform[email]"
                    className="sp-form-control"
                    placeholder="username@gmail.com"
                    autoComplete="on"
                    required
                  />
                </div>

                <div className="sp-field sp-button-container">
                  <button className="sp-button">Enviar</button>
                </div>
              </form>

              <div className="sp-link-wrapper sp-brandname__left mt-3">
                <a
                  className="sp-link text-[11px] text-slate-400 hover:text-slate-200"
                  target="_blank"
                  href="https://sendpulse.com/forms-powered-by-sendpulse"
                  rel="noreferrer"
                >
                  Entregado por SendPulse
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Script
        src="//web.webformscr.com/apps/fc3/build/default-handler.js"
        strategy="lazyOnload"
      />
    </section>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// Hook del contador
function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = Math.max(0, targetDate.getTime() - Date.now());
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.max(0, targetDate.getTime() - Date.now());
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

export default function Countdown() {
  const [countdownHours, setCountdownHours] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Obtener horas desde Firebase
  useEffect(() => {
    const fetchCountdown = async () => {
      try {
        const ref = doc(db, "settings", "countdown");
        const snap = await getDoc(ref);

        if (snap.exists() && snap.data().hours != null) {
          setCountdownHours(snap.data().hours);
        }
      } catch (e) {
        console.error("Error obteniendo countdown:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchCountdown();
  }, []);

  // 🔹 Usar un valor seguro para los hooks
  const safeHours = countdownHours ?? 0; // 0 horas mientras carga

  // 🔹 hooks SIEMPRE se ejecutan
  const countdownTarget = useMemo(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    return new Date(now.getTime() + safeHours * 60 * 60 * 1000);
  }, [safeHours]);

  const countdown = useCountdown(countdownTarget);

  // 🔹 UI condicional: solo mostrar si hay horas válidas
  if (loading || countdownHours === null || countdownHours === 0) {
    return null; // nada mientras carga o no hay horas
  }

  return (
    <div className="flex flex-col items-center justify-center mt-2 mb-2">
      <span className="block text-lg md:text-2xl font-bold text-slate-700 mb-2">
        Las promociones terminan en:
      </span>
      <span className="text-3xl md:text-7xl font-extrabold text-samsungBlue tracking-widest">
        {String(countdown.days).padStart(2, "0")}:
        {String(countdown.hours).padStart(2, "0")}:
        {String(countdown.minutes).padStart(2, "0")}:
        {String(countdown.seconds).padStart(2, "0")}
      </span>
    </div>
  );
}
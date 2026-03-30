"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Gift {
  id: string;
  name: string;
  description: string;
  image: string;
  popupActive: boolean;
}

export default function GiftPopup({ onClose, onRegister }: { onClose: () => void; onRegister: () => void }) {
  const [gift, setGift] = useState<Gift | null>(null);

  useEffect(() => {
    const fetchGift = async () => {
      const q = query(collection(db, "gifts"), where("popupActive", "==", true));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        setGift({ id: d.id, ...(d.data() as any) });
      }
    };
    fetchGift();
  }, []);

  if (!gift) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 animate-fadeInUp">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full bg-slate-200 p-1.5 text-slate-600 hover:bg-slate-300 hover:text-slate-900 transition"
          aria-label="Cerrar"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M6 6l12 12M6 18L18 6"/></svg>
        </button>
        <div className="flex flex-col items-center text-center space-y-4">
          <img src={gift.image} alt={gift.name} className="w-32 h-32 object-cover rounded-xl shadow-lg border-4 border-samsungBlue animate-pop" />
          <h2 className="text-2xl font-bold text-samsungBlue animate-fadeIn">{gift.name}</h2>
          <p className="text-slate-700 text-base animate-fadeIn delay-100">{gift.description}</p>
          <button
            onClick={onRegister}
            className="mt-2 w-full rounded-lg bg-samsungBlue px-6 py-3 text-lg font-semibold text-white shadow-lg hover:bg-samsungBlue/90 transition animate-bounce"
          >
            ¡Quiero registrarme y ganar!
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.5s cubic-bezier(.4,0,.2,1) both; }
        @keyframes pop {
          0% { transform: scale(0.8); }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .animate-pop { animation: pop 0.5s cubic-bezier(.4,0,.2,1) both; }
        .animate-fadeIn { animation: fadeInUp 0.7s cubic-bezier(.4,0,.2,1) both; }
        .delay-100 { animation-delay: 0.1s; }
        .animate-bounce { animation: bounce 1.2s infinite alternate; }
        @keyframes bounce {
          0% { transform: translateY(0); }
          100% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

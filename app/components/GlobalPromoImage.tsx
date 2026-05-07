"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useGlobalPromoImage() {
  const [globalImage, setGlobalImage] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "globalPromo"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setGlobalImage(data.image || "");
      }
      setLoading(false);
    }, (error) => {
      console.error("Error cargando imagen global:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { globalImage, loading };
}

"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Confetti from "react-confetti";

interface Gift {
  id: string;
  name: string;
  description: string;
  image: string;
  popupActive: boolean;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  giftId?: string;
}

function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl relative animate-in fade-in zoom-in">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-800 text-xl"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

export default function AdminGiftsPage() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [winner, setWinner] = useState<Client | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  useEffect(() => {
    const q = query(collection(db, "gifts"), orderBy("name"));
    return onSnapshot(q, (snap) => {
      setGifts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
  }, []);

  // ✅ SOLO UN SWITCH ACTIVO
  const handleTogglePopup = async (gift: Gift) => {
    const updates = gifts.map(async (g) => {
      await updateDoc(doc(db, "gifts", g.id), {
        popupActive: g.id === gift.id ? !gift.popupActive : false,
      });
    });
    await Promise.all(updates);
  };

  const handleAddGift = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, "gifts"), {
      name,
      description,
      image,
      popupActive: false,
      createdAt: new Date(),
    });
    setName("");
    setDescription("");
    setImage("");
  };

  const handleGiftClick = async (gift: Gift) => {
    setSelectedGift(gift);
    setModalOpen(true);

    const q = query(
      collection(db, "clients"),
      where("giftId", "==", gift.id)
    );
    const snap = await getDocs(q);
    setClients(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  };

  const handleDrawWinner = () => {
    if (clients.length === 0) return;

    setIsDrawing(true);
    let steps = 40;
    let i = 0;

    const animate = () => {
      setHighlightedIndex(i % clients.length);
      if (steps-- > 0) {
        i++;
        setTimeout(animate, 60 + i * 5);
      } else {
        const win = clients[i % clients.length];
        setWinner(win);
        setHighlightedIndex(null);
        setConfetti(true);
        setIsDrawing(false);
      }
    };

    animate();
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white">
        🎁 Gestión de Regalos
      </h2>

      {/* FORM */}
      <form
        onSubmit={handleAddGift}
        className="grid gap-3 max-w-xl bg-white p-4 rounded-xl shadow"
      >
        <input
          className="input text-black"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="input text-black"
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          className="input text-black"
          placeholder="Imagen URL"
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />
        <button className="btn-primary">Crear regalo</button>
      </form>

      {/* GRID */}
      <div className="grid md:grid-cols-2 gap-5">
        {gifts.map((gift) => (
          <div
            key={gift.id}
            onClick={() => handleGiftClick(gift)}
            className={`group cursor-pointer rounded-2xl border p-4 transition shadow-sm hover:shadow-xl ${
              gift.popupActive
                ? "border-green-500 ring-2 ring-green-300"
                : "border-slate-200"
            }`}
          >
            <div className="flex gap-4">
              <img
                src={gift.image}
                className="w-24 h-24 rounded-xl object-cover"
              />

              <div className="flex-1">
                <p className="font-semibold text-lg">{gift.name}</p>
                <p className="text-sm text-slate-500">
                  {gift.description}
                </p>
              </div>

              {/* SWITCH */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTogglePopup(gift);
                }}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
                  gift.popupActive ? "bg-green-500" : "bg-slate-300"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow transform transition ${
                    gift.popupActive ? "translate-x-6" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <h3 className="text-xl font-bold mb-4 text-black">
          Participantes - {selectedGift?.name}
        </h3>

        {clients.length === 0 ? (
          <p className="text-black">No hay participantes</p>
        ) : (
          <>
            <div className="grid gap-2 max-h-64 overflow-auto">
              {clients.map((c, idx) => (
                <div
                  key={c.id}
                  className={`p-3 rounded-lg border transition ${
                    highlightedIndex === idx
                      ? "bg-yellow-200 scale-105"
                      : ""
                  } ${
                    winner?.id === c.id
                      ? "bg-green-300 scale-110 font-bold"
                      : ""
                  }`}
                >
                  <p className="text-black">{c.name}</p>
                  <p className="text-xs text-black">
                    {c.email}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={handleDrawWinner}
              className="btn-primary w-full mt-4"
            >
              🎉 Sortear ganador
            </button>

            {winner && (
              <div className="text-center mt-6">
                <h4 className="text-2xl font-bold text-green-600">
                  🎉 Ganador
                </h4>
                <p className="text-lg">{winner.name}</p>
              </div>
            )}

            {confetti && (
              <Confetti
                width={window.innerWidth}
                height={window.innerHeight}
              />
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
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
  getDoc,
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
  // NUEVO: cantidad de ganadores y lista de ganadores
  const [maxWinners, setMaxWinners] = useState(1);
  const [winners, setWinners] = useState<Client[]>([]);
  const [allWinners, setAllWinners] = useState<Client[]>([]);
  // Controla si mostrar el mensaje de sorteo terminado
  const [showFinished, setShowFinished] = useState(false);

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
    setWinner(null);
    setConfetti(false);
    setHighlightedIndex(null);
    setShowFinished(false);
    // Leer ganadores guardados en el documento del regalo
    const giftDoc = await getDoc(doc(db, "gifts", gift.id));
    const giftData = giftDoc.data();
    let savedWinners: Client[] = [];
    let savedMax = 1;
    let savedAllWinners: Client[] = [];
    if (giftData && Array.isArray(giftData.winners)) {
      savedWinners = giftData.winners;
    }
    if (giftData && typeof giftData.maxWinners === "number") {
      savedMax = giftData.maxWinners;
    }
    if (giftData && Array.isArray(giftData.allWinners)) {
      savedAllWinners = giftData.allWinners;
    }
    setWinners(savedWinners);
    setMaxWinners(savedMax);
    setAllWinners(savedAllWinners);
    // Participantes = todos menos los ganadores históricos
    const q = query(
      collection(db, "clients"),
      where("giftId", "==", gift.id)
    );
    const snap = await getDocs(q);
    const allClients = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    setClients(allClients.filter(c => !savedAllWinners.some(w => w.id === c.id)));
  };

  // Volver a sortear: limpia ganadores y actualiza Firestore
  // Los usuarios que ya ganaron ese regalo nunca vuelven a participar
  const handleResetWinners = async () => {
    if (!selectedGift) return;
    setWinners([]);
    setWinner(null);
    setShowFinished(false);
    setConfetti(false);
    setHighlightedIndex(null);
    // Leer todos los ganadores históricos de este regalo
    const giftDoc = await getDoc(doc(db, "gifts", selectedGift.id));
    const giftData = giftDoc.data();
    let savedAllWinners: Client[] = [];
    if (giftData && Array.isArray(giftData.allWinners)) {
      savedAllWinners = giftData.allWinners;
    }
    setAllWinners(savedAllWinners);
    // Participantes = todos los clientes con ese giftId que no estén en allWinners
    const q = query(
      collection(db, "clients"),
      where("giftId", "==", selectedGift.id)
    );
    const snap = await getDocs(q);
    const allClients = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    const filteredClients = allClients.filter(c => !savedAllWinners.some(w => w.id === c.id));
    setClients(filteredClients);
    // Limpiar ganadores en Firestore pero mantener maxWinners y actualizar allWinners si no existe
    await updateDoc(doc(db, "gifts", selectedGift.id), {
      winners: [],
      maxWinners: maxWinners,
      allWinners: savedAllWinners,
    });
  };

  const handleDrawWinner = async () => {
    // Solo sortear si hay participantes y no se ha llegado al máximo
    if (clients.length === 0 || winners.length >= maxWinners || !selectedGift) return;

    setIsDrawing(true);
    setWinner(null);
    setConfetti(false);
    setShowFinished(false);
    // Elegir índice ganador aleatorio
    const winnerIndex = Math.floor(Math.random() * clients.length);
    let steps = 40 + winnerIndex; // Asegura que termina en el índice ganador
    let i = 0;

    const animate = async () => {
      setHighlightedIndex(i % clients.length);
      if (steps-- > 0) {
        i++;
        setTimeout(animate, 60 + i * 5);
      } else {
        const win = clients[winnerIndex];
        setWinner(win);
        // Guardar ganadores en Firestore
        const newWinners = [...winners, win];
        setWinners(newWinners);
        setClients((prev) => prev.filter((c) => c.id !== win.id)); // Elimina ganador de la lista
        setHighlightedIndex(null);
        setConfetti(true);
        setIsDrawing(false);
        // Actualizar en Firestore: winners y allWinners (histórico)
        const giftDoc = await getDoc(doc(db, "gifts", selectedGift.id));
        const giftData = giftDoc.data();
        let allWinners: Client[] = [];
        if (giftData && Array.isArray(giftData.allWinners)) {
          allWinners = giftData.allWinners;
        }
        // Agregar el nuevo ganador al histórico si no está
        const updatedAllWinners = allWinners.some(w => w.id === win.id) ? allWinners : [...allWinners, win];
        updateDoc(doc(db, "gifts", selectedGift.id), {
          winners: newWinners,
          maxWinners: maxWinners,
          allWinners: updatedAllWinners,
        });
        // Si es el último ganador, mostrar mensaje después de confetti
        if (newWinners.length >= maxWinners) {
          setTimeout(() => {
            setConfetti(false);
            setShowFinished(true);
          }, 2500); // 2.5 segundos de confetti antes de mostrar mensaje
        }
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

        {/* Campo para cantidad de ganadores */}
        <div className="mb-4 flex items-center gap-2">
          <label className="text-black font-semibold">Cantidad de ganadores:</label>
          <input
            type="number"
            min={1}
            max={clients.length + winners.length || 1}
            value={maxWinners}
            onChange={async e => {
              const val = Math.max(1, Math.min(Number(e.target.value), clients.length + winners.length || 1));
              setMaxWinners(val);
              setWinners(w => w.slice(0, val));
              // Guardar nuevo máximo y recorte de ganadores en Firestore si hay un regalo seleccionado
              if (selectedGift) {
                await updateDoc(doc(db, "gifts", selectedGift.id), {
                  maxWinners: val,
                  winners: winners.slice(0, val),
                });
              }
            }}
            className="input w-20 text-black"
            disabled={isDrawing || (winners.length >= maxWinners && !confetti)}
          />
        </div>

        {/* Lista de ganadores históricos y actuales */}
        {(allWinners.length > 0 || winners.length > 0) && (
          <div className="mb-4">
            <h4 className="text-green-700 font-bold">Ganadores:</h4>
            <ul className="list-disc pl-5">
              {/* Ganadores del sorteo actual (enfasis fuerte) */}
              {winners.map((w, i) => (
                <li key={w.id} className="text-black font-bold">
                  {i + 1}. {w.name} <span className="text-xs text-slate-600">({w.email})</span>
                  <span className="ml-2 text-green-600 font-semibold">(Actual)</span>
                </li>
              ))}
              {/* Ganadores históricos (menos énfasis, solo si no están en winners) */}
              {allWinners.filter(w => !winners.some(cw => cw.id === w.id)).map((w, i) => (
                <li key={w.id} className="text-slate-400">
                  {w.name} <span className="text-xs">({w.email})</span>
                  <span className="ml-2 text-slate-400">(Anterior)</span>
                </li>
              ))}
            </ul>
            {winners.length >= maxWinners && !confetti && (
              <>
                <div className="mt-2 text-center text-lg font-bold text-blue-700">Sorteo terminado</div>
                <div className="flex justify-center mt-2">
                  <button
                    className="btn-primary"
                    onClick={handleResetWinners}
                  >
                    Volver a sortear
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Participantes restantes */}
        {winners.length >= maxWinners && !confetti ? (
          <div className="text-black text-center font-semibold"></div>
        ) : clients.length === 0 ? (
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
              className={`btn-primary w-full mt-4 ${winners.length >= maxWinners || clients.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={winners.length >= maxWinners || clients.length === 0 || isDrawing}
            >
              {winners.length >= maxWinners ? 'Cantidad máxima' : '🎉 Sortear ganador'}
            </button>

            {winner && (
              <div className="text-center mt-6">
                <h4 className="text-2xl font-bold text-green-600">
                  🎉 Ganador
                </h4>
                <div className="mt-2 text-lg font-semibold text-slate-900">
                  {winner.name}
                </div>
                <div className="text-base text-slate-700">
                  {winner.email}
                </div>
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
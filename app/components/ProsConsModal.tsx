"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface ProsConsItem {
  _id: string;
  type: "pro" | "con";
  text: string;
}

export default function ProsConsModal({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<ProsConsItem[]>([]);
  const [newPro, setNewPro] = useState("");
  const [newCon, setNewCon] = useState("");

  useEffect(() => {
    fetch("/api/proscons")
      .then(res => res.json())
      .then(setItems);
  }, []);

  const presetOptions = [
    { label: "We win the case", type: "pro" },
    { label: "Dadaji & Dadaji take care of the property so it is not disintegrated", type: "pro" },
    { label: "Their is a court receiver. This ensures accountability is with the court", type: "pro" },
    { label: "Though we are in airport zone, we are not restricted to 2 storeys.", type: "pro" },
    { label: "All Dadaji's have passed away. And no outcome in this matter.", type: "con" },
    { label: "Most uncles are very senior citizens", type: "con" },
    { label: "Though there is a court receiver, encroachment is still active.", type: "con" },
    { label: "Being in airport zone, we cannot go more above 12–13 storeys.", type: "con" },
  ];

  const addItem = async (type: "pro" | "con", text: string) => {
    if (!text) return;

    const res = await fetch("/api/proscons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, text })
    });

    const responseText = await res.text();
    try {
      const newItem = JSON.parse(responseText);
      setItems(prev => [...prev, { _id: newItem.insertedId, type, text }]);
      if (type === "pro") setNewPro("");
      if (type === "con") setNewCon("");
    } catch (err) {
      console.error("Failed to parse JSON:", err);
    }
  };

  const deleteItem = async (id: string) => {
    await fetch("/api/proscons", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    setItems(prev => prev.filter(item => item._id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-[48rem] max-w-full shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          <X />
        </button>

        <h2 className="text-scaled-xl font-bold mb-4 text-center">Insights</h2>

        <div className="grid grid-cols-2 gap-6">
          {/* Pros */}
          <div>
            <h3 className="font-semibold text-green-700 mb-2 text-scaled-base">Pros</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {presetOptions.filter(p => p.type === "pro").map((preset, idx) => (
                <button
                  key={idx}
                  className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 hover:bg-green-200"
                  onClick={() => addItem("pro", preset.label)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <ul className="list-disc list-inside text-scaled-sm mb-2">
              {items.filter(i => i.type === "pro").map(i => (
                <li key={i._id} className="flex justify-between">
                  {i.text}
                  <button onClick={() => deleteItem(i._id)} className="text-red-500 ml-2">✕</button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                className="border p-1 rounded flex-grow"
                value={newPro}
                onChange={e => setNewPro(e.target.value)}
                placeholder="Add a pro..."
              />
              <button
                className="bg-green-500 text-white px-3 py-1 rounded"
                onClick={() => addItem("pro", newPro)}
              >
                Add
              </button>
            </div>
          </div>

          {/* Cons */}
          <div>
            <h3 className="font-semibold text-red-700 mb-2">Cons</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {presetOptions.filter(p => p.type === "con").map((preset, idx) => (
                <button
                  key={idx}
                  className="text-xs px-2 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200"
                  onClick={() => addItem("con", preset.label)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <ul className="list-disc list-inside text-sm mb-2">
              {items.filter(i => i.type === "con").map(i => (
                <li key={i._id} className="flex justify-between">
                  {i.text}
                  <button onClick={() => deleteItem(i._id)} className="text-red-500 ml-2">✕</button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                className="border p-1 rounded flex-grow"
                value={newCon}
                onChange={e => setNewCon(e.target.value)}
                placeholder="Add a con..."
              />
              <button
                className="bg-red-500 text-white px-3 py-1 rounded"
                onClick={() => addItem("con", newCon)}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

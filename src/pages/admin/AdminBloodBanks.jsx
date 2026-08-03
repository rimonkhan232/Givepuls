import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, Droplet, Pencil, Save, X, CheckCircle2 } from "lucide-react";
import { db } from "../../lib/db";
import { BLOOD_GROUPS } from "../../lib/bloodUtils";

function stockTint(count) {
  if (count === 0) return "bg-gray-50 text-gray-400";
  if (count < 10) return "bg-amber-50 text-amber-700";
  return "bg-emerald-50 text-emerald-700";
}

export default function AdminBloodBanks() {
  const [banks, setBanks] = useState(() => db.bloodBanks.list());
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [toast, setToast] = useState(null);

  const startEdit = (bank) => {
    setEditingId(bank.id);
    setDraft({ ...bank, stock: { ...bank.stock } });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEdit = () => {
    const cleanedStock = {};
    BLOOD_GROUPS.forEach((g) => {
      cleanedStock[g] = Math.max(0, Number(draft.stock[g]) || 0);
    });
    const updated = db.bloodBanks.update(editingId, {
      name: draft.name,
      address: draft.address,
      phone: draft.phone,
      division: draft.division,
      stock: cleanedStock,
    });
    setBanks((prev) => prev.map((b) => (b.id === editingId ? updated : b)));
    setEditingId(null);
    setDraft(null);
    setToast("Blood bank details updated.");
    setTimeout(() => setToast(null), 2200);
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-sky-950">Blood Bank Management</h1>
      <p className="text-sm text-sky-900/50 mt-1">Edit blood bank details and unit stock levels.</p>

      <div className="grid lg:grid-cols-2 gap-5 mt-6">
        {banks.map((bank, i) => {
          const isEditing = editingId === bank.id;
          const total = Object.values(bank.stock).reduce((a, b) => a + b, 0);
          return (
            <motion.div
              key={bank.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-white rounded-2xl border p-6 ${isEditing ? "border-sky-400 ring-2 ring-sky-100" : "border-sky-100"}`}
            >
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-sky-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400"
                    placeholder="Blood bank name"
                  />
                  <input
                    value={draft.address}
                    onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    placeholder="Address"
                  />
                  <input
                    value={draft.phone}
                    onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    placeholder="Phone"
                  />
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display font-semibold text-sky-950">{bank.name}</h3>
                    <p className="text-xs text-sky-900/50 flex items-center gap-1 mt-1">
                      <MapPin size={11} /> {bank.address}
                    </p>
                    <p className="text-xs text-sky-900/50 flex items-center gap-1 mt-1">
                      <Phone size={11} /> {bank.phone}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center">
                      <Droplet size={16} />
                    </div>
                    <p className="text-[11px] text-sky-900/40 mt-1">{total} units total</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 gap-2 mt-5">
                {BLOOD_GROUPS.map((g) => (
                  <div key={g} className={`rounded-xl py-2 text-center ${isEditing ? "bg-sky-50" : stockTint(bank.stock[g])}`}>
                    <p className="text-xs font-bold">{g}</p>
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={draft.stock[g]}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, stock: { ...d.stock, [g]: e.target.value } }))
                        }
                        className="w-full text-center text-sm font-semibold bg-transparent border-b border-sky-300 focus:outline-none"
                      />
                    ) : (
                      <p className="text-sm font-semibold">{bank.stock[g]}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5 flex justify-end gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={cancelEdit}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-sky-700 hover:bg-sky-50 transition-colors"
                    >
                      <X size={14} /> Cancel
                    </button>
                    <button
                      onClick={saveEdit}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl gradient-admin text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      <Save size={14} /> Save
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startEdit(bank)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-sky-200 text-sky-700 text-sm font-semibold hover:bg-sky-50 transition-colors"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-sky-950 text-white text-sm font-medium px-5 py-3 rounded-full shadow-xl flex items-center gap-2"
          >
            <CheckCircle2 size={16} className="text-emerald-400" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Save, Droplet, X } from "lucide-react";
import { db } from "../lib/db";
import { BLOOD_GROUPS } from "../lib/bloodUtils";

const emptyStock = Object.fromEntries(BLOOD_GROUPS.map((g) => [g, 0]));

export default function AdminBloodBanks() {
  const [banks, setBanks] = useState(() => db.bloodBanks.list());
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newBank, setNewBank] = useState({ name: "", address: "", phone: "", division: "Dhaka", stock: { ...emptyStock } });

  const startEdit = (bank) => {
    setEditingId(bank.id);
    setDraft({ ...bank, stock: { ...bank.stock } });
  };

  const saveEdit = () => {
    db.bloodBanks.update(editingId, draft);
    setBanks(db.bloodBanks.list());
    setEditingId(null);
    setDraft(null);
  };

  const removeBank = (bank) => {
    if (!window.confirm(`Delete ${bank.name}? This can't be undone.`)) return;
    db.bloodBanks.remove(bank.id);
    setBanks(db.bloodBanks.list());
  };

  const createBank = (e) => {
    e.preventDefault();
    const created = db.bloodBanks.create(newBank);
    setBanks((prev) => [created, ...prev]);
    setShowNew(false);
    setNewBank({ name: "", address: "", phone: "", division: "Dhaka", stock: { ...emptyStock } });
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-sky-950">Blood Banks</h1>
          <p className="text-sm text-sky-900/50 mt-1">{banks.length} partner bank(s)</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-admin text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Add Blood Bank
        </button>
      </div>

      <div className="space-y-5">
        {banks.map((bank) => {
          const isEditing = editingId === bank.id;
          const source = isEditing ? draft : bank;
          return (
            <motion.div
              key={bank.id}
              layout
              className={`bg-white rounded-2xl border p-6 ${isEditing ? "border-sky-300 ring-2 ring-sky-100" : "border-sky-100"}`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[220px] space-y-2">
                  {isEditing ? (
                    <>
                      <input
                        value={draft.name}
                        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-sky-200 text-sm font-semibold focus-ring-admin"
                      />
                      <input
                        value={draft.address}
                        onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-sky-200 text-xs focus-ring-admin"
                        placeholder="Address"
                      />
                      <input
                        value={draft.phone}
                        onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-sky-200 text-xs focus-ring-admin"
                        placeholder="Phone"
                      />
                    </>
                  ) : (
                    <>
                      <h3 className="font-display font-semibold text-sky-950">{bank.name}</h3>
                      <p className="text-xs text-sky-900/50">{bank.address}</p>
                      <p className="text-xs text-sky-900/50">{bank.phone}</p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center">
                    <Droplet size={16} />
                  </div>
                  {isEditing ? (
                    <button
                      onClick={saveEdit}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors"
                    >
                      <Save size={13} /> Save
                    </button>
                  ) : (
                    <button
                      onClick={() => startEdit(bank)}
                      className="text-xs font-semibold px-3 py-2 rounded-lg border border-sky-200 text-sky-700 hover:bg-sky-50 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => removeBank(bank)}
                    className="p-2 rounded-lg text-sky-900/40 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-5">
                {BLOOD_GROUPS.map((g) => (
                  <div key={g} className="rounded-xl bg-sky-50 py-2 text-center">
                    <p className="text-xs font-bold text-sky-800">{g}</p>
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={source.stock[g]}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, stock: { ...d.stock, [g]: Math.max(0, Number(e.target.value)) } }))
                        }
                        className="w-full text-center text-sm font-semibold bg-transparent border-b border-sky-300 focus:outline-none"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-sky-900">{source.stock[g]}</p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowNew(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold text-sky-950">Add Blood Bank</h2>
                <button onClick={() => setShowNew(false)} className="p-2 rounded-full hover:bg-sky-50 text-sky-700">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={createBank} className="space-y-4">
                <input
                  required
                  value={newBank.name}
                  onChange={(e) => setNewBank((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Bank name"
                  className="w-full px-3 py-2.5 rounded-xl border border-sky-200 text-sm focus-ring-admin"
                />
                <input
                  required
                  value={newBank.address}
                  onChange={(e) => setNewBank((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Address"
                  className="w-full px-3 py-2.5 rounded-xl border border-sky-200 text-sm focus-ring-admin"
                />
                <input
                  required
                  value={newBank.phone}
                  onChange={(e) => setNewBank((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="Phone"
                  className="w-full px-3 py-2.5 rounded-xl border border-sky-200 text-sm focus-ring-admin"
                />
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl gradient-admin text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  Create blood bank
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

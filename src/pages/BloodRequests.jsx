import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MapPin, Clock, MessageCircle, X, Activity, FileWarning } from "lucide-react";
import { db, resolveContactId } from "../lib/db";
import { BLOOD_GROUPS, formatDate } from "../lib/bloodUtils";
import { useAuth } from "../context/AuthContext";
import BloodGroupBadge from "../components/BloodGroupBadge";
import { useLanguage } from "../context/LanguageContext";

export default function BloodRequests() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [requests, setRequests] = useState(() => db.bloodRequests.list());
  const [open, setOpen] = useState(false);
  const hasReports = db.bloodTestReports.filter((r) => r.userId === user.id).length > 0;

  const [form, setForm] = useState({
    bloodGroup: "O+",
    units: 1,
    location: "",
    urgency: "Urgent",
    neededBy: "As fast as possible",
    notes: "",
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!hasReports) return;
    const created = db.bloodRequests.create({
      requesterId: user.id,
      requesterName: user.fullName,
      status: "open",
      ...form,
      units: Number(form.units),
    });
    setRequests((prev) => [created, ...prev]);
    setOpen(false);
    setForm({ bloodGroup: "O+", units: 1, location: "", urgency: "Urgent", neededBy: "As fast as possible", notes: "" });
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-crimson-950">{t("requests")}</h1>
          <p className="text-sm text-crimson-900/50 mt-1">{requests.length} request(s) posted</p>
        </div>
        {hasReports ? (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> Create Request
          </button>
        ) : (
          <Link
            to="/reports"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold hover:bg-amber-200 transition-colors"
          >
            <FileWarning size={16} /> Upload a report to post a request
          </Link>
        )}
      </div>

      {!hasReports && (
        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded-xl">
          <FileWarning size={18} className="shrink-0 mt-0.5" />
          <p>
            To keep exchanges safe, posting a blood request requires at least one uploaded blood test
            report on file. <Link to="/reports" className="font-semibold underline">Upload one now</Link>.
          </p>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="text-center py-20 text-crimson-900/40">
          <Activity size={40} className="mx-auto mb-3" />
          <p>No blood requests yet. Be the first to post one.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {requests.map((r, i) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl border border-crimson-100 p-5 card-lift relative"
              >
                {r.urgency === "Urgent" && (
                  <span className="absolute top-5 right-5 text-[11px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                    Urgent
                  </span>
                )}
                <BloodGroupBadge group={r.bloodGroup} pulse={r.urgency === "Urgent"} />
                <p className="mt-3 text-sm font-semibold text-crimson-950">{r.units} unit(s)</p>
                <p className="text-sm text-crimson-900/60 flex items-center gap-1.5 mt-2">
                  <MapPin size={13} /> {r.location}
                </p>
                <p className="text-sm text-crimson-900/60 flex items-center gap-1.5 mt-1">
                  <Clock size={13} /> {formatDate(r.createdAt)}
                </p>
                {r.notes && <p className="text-xs text-crimson-900/50 mt-2 italic">"{r.notes}"</p>}
                <p className="text-sm text-crimson-900/50 mt-2">{r.neededBy}</p>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-crimson-100">
                  <span className="text-xs font-semibold text-crimson-800">{r.requesterName}</span>
                  {r.requesterId === user.id ? (
                    <span className="text-xs text-crimson-900/30">Your request</span>
                  ) : (
                    <Link
                      to="/messages"
                      state={{ withId: resolveContactId({ userId: r.requesterId }), name: r.requesterName }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-crimson-700 hover:underline"
                    >
                      <MessageCircle size={13} /> Contact
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold text-crimson-950">Create Blood Request</h2>
                <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-crimson-50 text-crimson-700">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-crimson-950">Blood group</label>
                    <select
                      value={form.bloodGroup}
                      onChange={(e) => setForm((f) => ({ ...f, bloodGroup: e.target.value }))}
                      className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
                    >
                      {BLOOD_GROUPS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-crimson-950">Units needed</label>
                    <input
                      type="number"
                      min="1"
                      value={form.units}
                      onChange={(e) => setForm((f) => ({ ...f, units: e.target.value }))}
                      className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-crimson-950">Location</label>
                  <input
                    required
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. Khilkhet, Dhaka"
                    className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-crimson-950">Urgency</label>
                    <select
                      value={form.urgency}
                      onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value }))}
                      className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
                    >
                      <option>Urgent</option>
                      <option>Moderate</option>
                      <option>Planned</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-crimson-950">Needed by</label>
                    <input
                      value={form.neededBy}
                      onChange={(e) => setForm((f) => ({ ...f, neededBy: e.target.value }))}
                      className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-crimson-950">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={3}
                    className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  Post request
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

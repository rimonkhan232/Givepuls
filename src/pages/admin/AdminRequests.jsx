import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, Activity, CheckCircle2, RotateCcw } from "lucide-react";
import { db } from "../../lib/db";
import { formatDate } from "../../lib/bloodUtils";

export default function AdminRequests() {
  const [requests, setRequests] = useState(() => db.bloodRequests.list());

  const toggleStatus = (r) => {
    const nextStatus = r.status === "open" ? "fulfilled" : "open";
    const updated = db.bloodRequests.update(r.id, { status: nextStatus });
    setRequests((prev) => prev.map((req) => (req.id === r.id ? updated : req)));
  };

  const open = requests.filter((r) => r.status === "open");
  const fulfilled = requests.filter((r) => r.status === "fulfilled");

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-sky-950">Blood Requests</h1>
      <p className="text-sm text-sky-900/50 mt-1">
        {open.length} open &middot; {fulfilled.length} fulfilled &middot; {requests.length} total
      </p>

      {requests.length === 0 ? (
        <div className="text-center py-20 text-sky-900/40">
          <Activity size={40} className="mx-auto mb-3" />
          <p>No blood requests have been posted yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {requests.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl border border-sky-100 p-5 relative"
            >
              <div className="flex items-start justify-between">
                <span className="w-11 h-11 rounded-2xl bg-sky-600 text-white font-bold flex items-center justify-center">
                  {r.bloodGroup}
                </span>
                <span
                  className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                    r.status === "open" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {r.status === "open" ? r.urgency : "Fulfilled"}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-sky-950">{r.units} unit(s)</p>
              <p className="text-sm text-sky-900/60 flex items-center gap-1.5 mt-2">
                <MapPin size={13} /> {r.location}
              </p>
              <p className="text-sm text-sky-900/60 flex items-center gap-1.5 mt-1">
                <Clock size={13} /> {formatDate(r.createdAt)}
              </p>
              {r.notes && <p className="text-xs text-sky-900/50 mt-2 italic">"{r.notes}"</p>}

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-sky-100">
                <span className="text-xs font-semibold text-sky-800">{r.requesterName}</span>
                <button
                  onClick={() => toggleStatus(r)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:underline"
                >
                  {r.status === "open" ? (
                    <>
                      <CheckCircle2 size={13} /> Mark fulfilled
                    </>
                  ) : (
                    <>
                      <RotateCcw size={13} /> Reopen
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

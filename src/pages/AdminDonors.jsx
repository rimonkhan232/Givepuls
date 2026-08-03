import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Trash2, ShieldCheck, ShieldAlert, MapPin, Star, Flag,
  ImageOff, Ban, RotateCcw, X,
} from "lucide-react";
import { db, blocklistDonorFromReport, dismissDonorReport, unblockDonor } from "../lib/db";
import { initials } from "../lib/bloodUtils";
import BloodGroupBadge from "../components/BloodGroupBadge";

function Stars({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={13} className={n <= value ? "text-amber-500 fill-amber-500" : "text-sky-100 fill-sky-100"} />
      ))}
    </div>
  );
}

function ReportCard({ report, donor, onBlocklist, onDismiss }) {
  const [lightbox, setLightbox] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="border border-sky-100 rounded-xl p-4"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-sky-950">
            {report.reporterName} <span className="text-sky-900/40 font-normal">reported</span>{" "}
            {donor?.fullName || "a removed donor"}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Stars value={report.rating} />
            <span className="text-xs text-sky-900/40">{new Date(report.createdAt).toLocaleDateString("en-GB")}</span>
          </div>
        </div>
        {donor?.blocked && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700">Donor blocked</span>
        )}
      </div>

      <p className="text-sm text-sky-900/70 mt-3 leading-relaxed">{report.complaint}</p>

      <div className="flex items-center gap-3 mt-3">
        {report.imageUrl ? (
          <button type="button" onClick={() => setLightbox(true)} className="shrink-0">
            <img src={report.imageUrl} alt="Proof" className="w-16 h-16 rounded-lg object-cover border border-sky-100" />
          </button>
        ) : (
          <div className="w-16 h-16 rounded-lg border border-sky-100 flex items-center justify-center text-sky-300">
            <ImageOff size={18} />
          </div>
        )}

        {report.status === "pending" ? (
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => onDismiss(report)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={() => onBlocklist(report)}
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              <Ban size={12} /> Blocklist &amp; ban
            </button>
          </div>
        ) : (
          <span
            className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full ${
              report.status === "actioned" ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            {report.status === "actioned" ? "Actioned" : "Dismissed"}
          </span>
        )}
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6 cursor-zoom-out"
          >
            <img src={report.imageUrl} alt="Proof" className="max-h-[80vh] max-w-full rounded-xl" />
            <button className="absolute top-5 right-5 text-white/80 hover:text-white">
              <X size={22} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AdminDonors() {
  const [query, setQuery] = useState("");
  const [donors, setDonors] = useState(() => db.donorProfiles.list());
  const [reviews, setReviews] = useState(() => db.reviews.list());
  const [reportFilter, setReportFilter] = useState("pending");
  const reports = db.bloodTestReports.list();

  const refresh = () => {
    setDonors(db.donorProfiles.list());
    setReviews(db.reviews.list());
  };

  const pendingCount = reviews.filter((r) => r.status === "pending").length;
  const visibleReviews = useMemo(
    () => reviews.filter((r) => (reportFilter === "all" ? true : r.status === reportFilter)),
    [reviews, reportFilter]
  );

  const handleBlocklist = (report) => {
    if (!window.confirm("Blocklist this donor and ban their account? They will no longer be able to log in.")) return;
    blocklistDonorFromReport(report.id);
    refresh();
  };

  const handleDismiss = (report) => {
    dismissDonorReport(report.id);
    refresh();
  };

  const handleUnban = (donor) => {
    if (!window.confirm(`Restore ${donor.fullName}'s account and remove them from the blocklist?`)) return;
    unblockDonor(donor.id);
    refresh();
  };

  const filtered = useMemo(
    () =>
      donors.filter(
        (d) =>
          !query ||
          d.fullName.toLowerCase().includes(query.toLowerCase()) ||
          d.division.toLowerCase().includes(query.toLowerCase())
      ),
    [donors, query]
  );

  const hasReport = (donor) => reports.some((r) => r.donorProfileId === donor.id);

  const toggleAvailability = (donor) => {
    db.donorProfiles.update(donor.id, { available: !donor.available });
    setDonors(db.donorProfiles.list());
  };

  const removeDonor = (donor) => {
    if (!window.confirm(`Remove ${donor.fullName} from the donor directory?`)) return;
    db.donorProfiles.remove(donor.id);
    setDonors(db.donorProfiles.list());
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-sky-950">Donors</h1>
          <p className="text-sm text-sky-900/50 mt-1">
            {filtered.length} registered donor(s)
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-red-700 font-semibold">
                <Flag size={12} /> {pendingCount} pending report{pendingCount === 1 ? "" : "s"}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-sky-100 p-5 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Flag size={16} className="text-sky-700" />
            <h2 className="font-display font-semibold text-sky-950">Ratings &amp; complaints</h2>
          </div>
          <div className="flex items-center gap-1.5">
            {[
              { key: "pending", label: "Pending" },
              { key: "actioned", label: "Actioned" },
              { key: "dismissed", label: "Dismissed" },
              { key: "all", label: "All" },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setReportFilter(opt.key)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  reportFilter === opt.key ? "bg-sky-700 text-white" : "bg-sky-50 text-sky-700 hover:bg-sky-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-sky-900/40 mb-4">
          Submitted privately by recipients — never shown to donors or other users. Blocklisting bans the donor's account immediately.
        </p>
        <div className="space-y-3">
          {visibleReviews.length === 0 && (
            <p className="text-sm text-sky-900/40 text-center py-8">No {reportFilter === "all" ? "" : reportFilter} reports.</p>
          )}
          <AnimatePresence>
            {visibleReviews.map((r) => (
              <ReportCard
                key={r.id}
                report={r}
                donor={donors.find((d) => d.id === r.donorProfileId)}
                onBlocklist={handleBlocklist}
                onDismiss={handleDismiss}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-sky-100 p-4 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or division..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-sky-200 focus-ring-admin text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-sky-100 overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-3 text-xs font-semibold text-sky-900/50 uppercase tracking-wide border-b border-sky-100">
          <span>Donor</span>
          <span>Group</span>
          <span>Report</span>
          <span>Status</span>
          <span>Account</span>
          <span></span>
        </div>
        <AnimatePresence>
          {filtered.map((d) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid sm:grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 items-center px-5 py-3.5 border-b border-sky-50 last:border-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center shrink-0">
                  {initials(d.fullName)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-sky-950 truncate">{d.fullName}</p>
                  <p className="text-xs text-sky-900/40 flex items-center gap-1">
                    <MapPin size={10} /> {d.division}
                  </p>
                </div>
              </div>

              <BloodGroupBadge group={d.bloodGroup} size="sm" theme="admin" />

              {hasReport(d) ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  <ShieldCheck size={12} /> On file
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                  <ShieldAlert size={12} /> Missing
                </span>
              )}

              <button
                onClick={() => toggleAvailability(d)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                  d.available ? "bg-sky-50 text-sky-700 hover:bg-sky-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {d.available ? "Available" : "Unavailable"}
              </button>

              {d.blocked ? (
                <button
                  onClick={() => handleUnban(d)}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                  title="Restore account"
                >
                  <RotateCcw size={11} /> Blocked
                </button>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">Active</span>
              )}

              <button
                onClick={() => removeDonor(d)}
                className="justify-self-end p-2 rounded-lg text-sky-900/40 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Remove donor"
              >
                <Trash2 size={15} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <p className="text-sm text-sky-900/40 text-center py-10">No donors match your search.</p>
        )}
      </div>
    </div>
  );
}

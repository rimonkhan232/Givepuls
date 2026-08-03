import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin, Phone, MessageSquare, Star, Droplet, Award, Flag, ShieldCheck, ImagePlus, X } from "lucide-react";
import { db, submitDonorReport } from "../lib/db";
import { useAuth } from "../context/AuthContext";
import { initials, formatDate, eligibleToDonate } from "../lib/bloodUtils";
import BloodGroupBadge from "../components/BloodGroupBadge";

function ReportDonorForm({ donor, reporter }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [complaint, setComplaint] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleImage = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rating) return setError("Please select a star rating.");
    if (!complaint.trim()) return setError("Please describe the issue.");
    if (!imageUrl) return setError("Please attach a proof image to verify your report.");
    setError("");
    submitDonorReport({
      donorProfileId: donor.id,
      reporterId: reporter.id,
      reporterName: reporter.fullName,
      rating,
      complaint: complaint.trim(),
      imageUrl,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-crimson-100 p-6 mt-6 text-center"
      >
        <ShieldCheck className="mx-auto text-crimson-600" size={26} />
        <p className="mt-2 font-semibold text-crimson-950">Report submitted</p>
        <p className="text-sm text-crimson-900/60 mt-1">
          Thank you. Your rating and complaint have been sent privately to the GivePulse admin team for
          review — this is never shown to {donor.fullName.split(" ")[0]} or other users.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-crimson-100 p-6 mt-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Flag size={16} className="text-crimson-600" />
          <span className="font-display font-semibold text-crimson-950">Rate &amp; report this donor</span>
        </div>
        <span className="text-xs font-semibold text-crimson-700">{open ? "Close" : "Open"}</span>
      </button>
      <p className="text-xs text-crimson-900/45 mt-1">
        Private and confidential — only visible to GivePulse admins, never to the donor or other users.
      </p>

      <AnimatePresence>
        {open && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="overflow-hidden"
          >
            <div className="pt-5 space-y-4 border-t border-crimson-100 mt-4">
              <div>
                <label className="text-sm font-semibold text-crimson-950">Your rating</label>
                <div className="flex items-center gap-1 mt-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(n)}
                      className="p-0.5"
                    >
                      <Star
                        size={22}
                        className={
                          n <= (hoverRating || rating)
                            ? "text-amber-500 fill-amber-500"
                            : "text-crimson-100 fill-crimson-100"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-crimson-950">
                  Describe the issue <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  rows={3}
                  placeholder="What happened? Please be specific — this helps our admin team verify your report."
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-crimson-950">
                  Proof image <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => document.getElementById("report-image-input")?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleImage(e.dataTransfer.files?.[0]);
                  }}
                  className="mt-1.5 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-crimson-200 rounded-xl py-5 text-center cursor-pointer hover:bg-crimson-50/60 transition-colors relative overflow-hidden"
                >
                  {imageUrl ? (
                    <>
                      <img src={imageUrl} alt="Proof" className="max-h-32 rounded-lg object-contain" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageUrl("");
                        }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-crimson-950/60 text-white hover:bg-crimson-950"
                      >
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <>
                      <ImagePlus size={20} className="text-crimson-500" />
                      <p className="text-sm text-crimson-800">
                        <span className="font-semibold underline">Click to upload</span> or drag &amp; drop
                      </p>
                      <p className="text-xs text-crimson-900/40">Required to verify your report</p>
                    </>
                  )}
                  <input
                    id="report-image-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImage(e.target.files?.[0])}
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-crimson-950 text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Submit report to admin
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function DonorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const donor = db.donorProfiles.get(id);

  if (!donor) {
    return (
      <div className="text-center py-24">
        <p className="text-crimson-900/50">Donor not found.</p>
        <button onClick={() => navigate("/donors")} className="mt-4 text-crimson-700 font-semibold">
          Back to donors
        </button>
      </div>
    );
  }

  const { eligible, daysLeft } = eligibleToDonate(donor.lastDonationDate);

  return (
    <div className="max-w-3xl">
      <Link to="/donors" className="inline-flex items-center gap-2 text-sm font-semibold text-crimson-700 mb-6">
        <ArrowLeft size={16} /> Back to donors
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl gradient-brand p-8 text-white relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/10 animate-drift" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-white/15 flex items-center justify-center text-2xl font-bold">
            {initials(donor.fullName)}
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">{donor.fullName}</h1>
            <p className="text-white/70 text-sm flex items-center gap-1 mt-1">
              <MapPin size={14} /> {donor.address ? `${donor.address}, ` : ""}{donor.division}
            </p>
            <div className="flex items-center gap-4 mt-3">
              <BloodGroupBadge group={donor.bloodGroup} />
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  donor.available ? "bg-emerald-400/20 text-emerald-100" : "bg-white/10 text-white/60"
                }`}
              >
                {donor.available ? "Available now" : "Unavailable"}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-crimson-100 p-5 text-center">
          <Droplet className="mx-auto text-crimson-600" size={20} />
          <p className="text-xl font-display font-bold text-crimson-950 mt-2">{donor.totalDonations}</p>
          <p className="text-xs text-crimson-900/50">Total donations</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-crimson-100 p-5 text-center">
          <Star className="mx-auto text-amber-500" size={20} />
          <p className="text-xl font-display font-bold text-crimson-950 mt-2">{donor.rating || "—"}</p>
          <p className="text-xs text-crimson-900/50">Community rating</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl border border-crimson-100 p-5 text-center">
          <Award className="mx-auto text-crimson-600" size={20} />
          <p className="text-xl font-display font-bold text-crimson-950 mt-2">
            {eligible ? "Eligible" : `${daysLeft}d`}
          </p>
          <p className="text-xs text-crimson-900/50">
            {eligible ? "Ready to donate" : "Until next eligible"}
          </p>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-crimson-100 p-6 mt-6">
        <h2 className="font-display font-semibold text-crimson-950 mb-3">About</h2>
        <p className="text-sm text-crimson-900/70 leading-relaxed">
          {donor.about || "This donor hasn't added a bio yet."}
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-crimson-100">
          <div className="flex items-center gap-2 text-sm text-crimson-900/70">
            <Phone size={14} className="text-crimson-500" /> {donor.phone || "Not shared"}
          </div>
          <div className="flex items-center gap-2 text-sm text-crimson-900/70">
            Last donation: {donor.lastDonationDate ? formatDate(donor.lastDonationDate) : "No record"}
          </div>
        </div>
      </motion.div>

      <div className="flex gap-3 mt-6">
        <Link
          to="/messages"
          state={{ withId: donor.id }}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-opacity"
        >
          <MessageSquare size={16} /> Message {donor.fullName.split(" ")[0]}
        </Link>
      </div>

      {donor.userId !== user.id && <ReportDonorForm donor={donor} reporter={user} />}
    </div>
  );
}

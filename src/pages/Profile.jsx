import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Save, User as UserIcon, FileWarning, CheckCircle2,
  Check, MapPin, Phone, Pencil, UploadCloud,
} from "lucide-react";
import { db, getOnboardingStatus } from "../lib/db";
import { useAuth } from "../context/AuthContext";
import { BLOOD_GROUPS, DIVISIONS, eligibleToDonate, initials } from "../lib/bloodUtils";
import BloodGroupBadge from "../components/BloodGroupBadge";

const WANTS_LABEL = { donate: "Donate Blood", find: "Find Blood", both: "Donate & Find Blood" };

function SuccessModal({ onContinue }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-crimson-950/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="bg-white rounded-2xl border-2 border-crimson-200 shadow-2xl shadow-crimson-950/20 w-full max-w-xs p-8 text-center"
      >
        <div className="w-14 h-14 rounded-full bg-crimson-600 text-white flex items-center justify-center mx-auto">
          <Check size={28} strokeWidth={3} />
        </div>
        <h2 className="mt-4 text-xl font-display font-bold text-crimson-700">Success!!!</h2>
        <p className="mt-2 text-sm text-crimson-900/60">
          Your settings have been successfully changed.
        </p>
        <button
          onClick={onContinue}
          className="mt-6 w-full py-2.5 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-opacity"
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
}

function InfoField({ label, value, icon: Icon }) {
  return (
    <div className="bg-crimson-50 rounded-xl px-4 py-3">
      <p className="text-xs font-semibold text-crimson-900/50">{label}</p>
      <p className="mt-1 text-sm font-medium text-crimson-950 flex items-center gap-1.5">
        {Icon && <Icon size={13} className="text-crimson-600 shrink-0" />}
        {value || "—"}
      </p>
    </div>
  );
}

function ProfileView({ profile, onEdit }) {
  const locationLine = [profile.address, profile.division].filter(Boolean).join(", ");
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-crimson-100 mt-6 overflow-hidden"
    >
      <div className="gradient-brand p-6 sm:p-7 text-white relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 animate-drift" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="w-14 h-14 rounded-full object-cover border-2 border-white/70 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-white/15 border-2 border-white/40 font-bold text-lg flex items-center justify-center shrink-0">
                {initials(profile.fullName) || <UserIcon size={20} />}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-display font-bold text-lg">{profile.fullName}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-white/80">
                {locationLine && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {locationLine}
                  </span>
                )}
                {profile.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={12} /> {profile.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-crimson-700 text-sm font-semibold hover:bg-crimson-50 transition-colors self-start shrink-0"
          >
            <Pencil size={14} /> Edit
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-7">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-crimson-950">Personal Information</h3>
          <BloodGroupBadge group={profile.bloodGroup} size="sm" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <InfoField label="Full Name" value={profile.fullName} />
          <InfoField label="Blood Group" value={profile.bloodGroup} />
          <InfoField label="Your Location" value={locationLine} icon={MapPin} />
          <InfoField label="Phone Number" value={profile.phone} icon={Phone} />
          <InfoField label="NID No" value={profile.nid} />
          <InfoField label="Looking To" value={WANTS_LABEL[profile.wants]} />
          <InfoField
            label="Last Donation"
            value={profile.lastDonationDate ? new Date(profile.lastDonationDate).toLocaleDateString("en-GB") : "Not yet donated"}
          />
        </div>
        {profile.about && (
          <div className="mt-3">
            <InfoField label="About Me" value={profile.about} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const onboarding = location.state?.onboarding;
  const existing = db.donorProfiles.list().find((p) => p.userId === user.id);
  const myReports = db.bloodTestReports.filter((r) => r.userId === user.id);
  const hasReports = myReports.length > 0;

  const [form, setForm] = useState(
    existing || {
      fullName: user.fullName,
      bloodGroup: "O+",
      division: "Dhaka",
      phone: "",
      nid: "",
      address: "",
      wants: "both",
      lastDonationDate: "",
      about: "",
      avatarUrl: "",
    }
  );
  const [status, setStatus] = useState("idle"); // idle | saving | saved | blocked
  const [mode, setMode] = useState(existing && !onboarding ? "view" : "form");
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedProfile, setSavedProfile] = useState(existing || null);
  const debounceRef = useRef(null);
  const firstRender = useRef(true);
  const fileInputRef = useRef(null);

  const { eligible, daysLeft } = eligibleToDonate(form.lastDonationDate);

  const persist = (data) => {
    if (!hasReports) {
      setStatus("blocked");
      return null;
    }
    const record = existing
      ? db.donorProfiles.update(existing.id, data)
      : db.donorProfiles.create({ userId: user.id, ...data });
    if (record) {
      setStatus("saved");
      setSavedProfile(record);
    }
    setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 2200);
    return record;
  };

  // Auto-save shortly after the user stops typing/changing fields — the
  // form itself is never cleared, only persisted in the background.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (mode !== "form") return;
    setStatus("saving");
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => persist(form), 900);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const handleSave = (e) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    const record = persist(form);
    if (onboarding) {
      const nowComplete = getOnboardingStatus(user.id);
      if (nowComplete.complete) {
        navigate(location.state?.from || "/dashboard", { replace: true });
        return;
      }
    }
    if (record) setShowSuccess(true);
  };

  const handleContinue = () => {
    setShowSuccess(false);
    setMode("view");
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const readAvatarFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, avatarUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-crimson-950">My Profile</h1>
          <p className="text-sm text-crimson-900/50 mt-1">{mode === "view" ? "Profile" : "Edit Profile"}</p>
        </div>
        {mode === "form" && (
          <AnimatePresence mode="wait">
            {status === "saving" && (
              <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs font-medium text-crimson-900/40">
                Saving…
              </motion.span>
            )}
            {status === "saved" && (
              <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={14} /> Saved automatically
              </motion.span>
            )}
          </AnimatePresence>
        )}
      </div>

      {onboarding && mode === "form" && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-crimson-50 border border-crimson-200 text-crimson-800 text-sm px-4 py-3 rounded-xl"
        >
          <p className="font-semibold">Welcome to GivePulse — let's finish setting up your account.</p>
          <p className="mt-1 text-crimson-700/80">
            Complete your profile and upload a test report to unlock donor search, messaging, and
            everything else on the site.
          </p>
        </motion.div>
      )}

      {!eligible && form.lastDonationDate && mode === "form" && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-xl"
        >
          <AlertTriangle size={16} /> {daysLeft} days have not completed since your last donation. ({daysLeft} days remaining)
        </motion.div>
      )}

      {!hasReports && mode === "form" && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded-xl"
        >
          <FileWarning size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">A blood test report is required to save your profile.</p>
            <p className="mt-1 text-red-700/80">
              Whether you want to donate or find blood, GivePulse requires at least one uploaded test
              report on file first, for everyone's safety.{" "}
              <Link
                to="/reports"
                state={{ onboarding, from: location.state?.from }}
                className="font-semibold underline"
              >
                Upload a report now
              </Link>.
            </p>
          </div>
        </motion.div>
      )}

      {mode === "view" && savedProfile ? (
        <ProfileView profile={savedProfile} onEdit={() => setMode("form")} />
      ) : (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-crimson-100 p-6 mt-6 space-y-5">
          <div className="flex items-center gap-4">
            {form.avatarUrl ? (
              <img src={form.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-crimson-100 text-crimson-700 font-bold text-lg flex items-center justify-center">
                {initials(form.fullName) || <UserIcon size={22} />}
              </div>
            )}
            <BloodGroupBadge group={form.bloodGroup} />
          </div>

          <div>
            <label className="text-sm font-semibold text-crimson-950">Full Name <span className="text-red-500">*</span></label>
            <input
              required
              value={form.fullName}
              onChange={set("fullName")}
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-crimson-950">Blood Group <span className="text-red-500">*</span></label>
              <select
                value={form.bloodGroup}
                onChange={set("bloodGroup")}
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
              >
                {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-crimson-950">Division <span className="text-red-500">*</span></label>
              <select
                value={form.division}
                onChange={set("division")}
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
              >
                {DIVISIONS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-crimson-950">Phone Number <span className="text-red-500">*</span></label>
            <input
              required
              value={form.phone}
              onChange={set("phone")}
              placeholder="01XXXXXXXXX"
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-crimson-950">Address <span className="text-red-500">*</span></label>
            <input
              required
              value={form.address}
              onChange={set("address")}
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-crimson-950">NID No <span className="text-red-500">*</span></label>
            <input
              required
              value={form.nid || ""}
              onChange={set("nid")}
              placeholder="National ID number"
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
            />
            <p className="text-xs text-crimson-900/40 mt-1">Used to verify your identity — never shown to other users.</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-crimson-950">I want to <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-3 gap-3 mt-1.5">
              {[
                { key: "donate", label: "Donate Blood" },
                { key: "find", label: "Find Blood" },
                { key: "both", label: "Both" },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.key}
                  onClick={() => setForm((f) => ({ ...f, wants: opt.key }))}
                  className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                    form.wants === opt.key
                      ? "border-crimson-600 bg-crimson-50 text-crimson-700"
                      : "border-crimson-100 text-crimson-900/60 hover:border-crimson-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-crimson-950">Last Donation Date</label>
            <input
              type="date"
              value={form.lastDonationDate || ""}
              onChange={set("lastDonationDate")}
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-crimson-950">About Me</label>
            <textarea
              value={form.about}
              onChange={set("about")}
              rows={3}
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-crimson-950">Profile Picture</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                readAvatarFile(e.dataTransfer.files?.[0]);
              }}
              className="mt-1.5 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-crimson-200 rounded-xl py-6 text-center cursor-pointer hover:bg-crimson-50/60 transition-colors"
            >
              <UploadCloud size={20} className="text-crimson-500" />
              <p className="text-sm text-crimson-800">
                <span className="font-semibold underline">Click to upload</span> or drag &amp; drop
              </p>
              <p className="text-xs text-crimson-900/40">Recommended square image, up to 5MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => readAvatarFile(e.target.files?.[0])}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!hasReports}
            className="w-full py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} /> {!hasReports ? "Upload a report to save" : "Save Changes"}
          </button>
        </form>
      )}

      <AnimatePresence>{showSuccess && <SuccessModal onContinue={handleContinue} />}</AnimatePresence>
    </div>
  );
}

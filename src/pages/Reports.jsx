import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { db, getOnboardingStatus } from "../lib/db";
import { useAuth } from "../context/AuthContext";
import { formatDate, TEST_CATEGORIES, testCategoryOf } from "../lib/bloodUtils";

const RESULTS = ["Negative", "Positive", "Pending"];

export default function Reports() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const myProfile = db.donorProfiles.list().find((p) => p.userId === user.id);
  const [reports, setReports] = useState(() => db.bloodTestReports.filter((r) => r.userId === user.id));
  const [form, setForm] = useState({ testType: "HIV", result: "Negative", testDate: "", fileName: "", notes: "" });
  const [fileError, setFileError] = useState("");

  const onboarding = location.state?.onboarding;
  const status = getOnboardingStatus(user.id);

  const handleUpload = (e) => {
    e.preventDefault();
    if (!form.fileName) {
      setFileError("A report file is required.");
      return;
    }
    setFileError("");
    const created = db.bloodTestReports.create({
      userId: user.id,
      donorProfileId: myProfile?.id || null,
      ...form,
    });
    setReports((prev) => [created, ...prev]);
    setForm({ testType: "HIV", result: "Negative", testDate: "", fileName: "", notes: "" });

    // If this was the last onboarding step, send the user on their way.
    const nowComplete = getOnboardingStatus(user.id);
    if (onboarding && nowComplete.complete) {
      navigate(location.state?.from || "/dashboard", { replace: true });
    } else if (onboarding && !nowComplete.profileComplete) {
      navigate("/profile", { state: { onboarding: true, from: location.state?.from } });
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-display font-bold text-crimson-950">Blood Test Reports</h1>
      <p className="text-sm text-crimson-900/50 mt-1">
        Upload your blood test reports so donors and seekers can verify safety before exchanging blood.
      </p>

      {!status.hasReport && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-xl"
        >
          <ShieldCheck size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">This step is required for every account.</p>
            <p className="mt-1 text-amber-800/80">
              Whether you're donating or looking for blood, GivePulse requires at least one uploaded
              test report before you can message anyone or use the rest of the site.
              {!status.profileComplete && (
                <>
                  {" "}You'll also need to finish{" "}
                  <Link to="/profile" state={{ onboarding: true, from: location.state?.from }} className="font-semibold underline">
                    your profile
                  </Link>.
                </>
              )}
            </p>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleUpload} className="bg-white rounded-2xl border border-crimson-100 p-6 mt-6 space-y-4">
        <div className="flex items-center gap-2 text-crimson-950 font-semibold">
          <Upload size={16} className="text-crimson-600" /> Upload Report
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-crimson-950">Test Type</label>
            <select
              value={form.testType}
              onChange={(e) => setForm((f) => ({ ...f, testType: e.target.value }))}
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
            >
              <option value="N/A">N/A — no specific test</option>
              {TEST_CATEGORIES.map((cat) => (
                <optgroup key={cat.category} label={cat.category}>
                  {cat.tests.map((t) => <option key={t}>{t}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-crimson-950">Result</label>
            <select
              value={form.result}
              onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))}
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
            >
              {RESULTS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-crimson-950">Test Date</label>
          <input
            type="date"
            required
            value={form.testDate}
            onChange={(e) => setForm((f) => ({ ...f, testDate: e.target.value }))}
            className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-crimson-950">
            Report File <span className="text-red-500">*</span>
          </label>
          <label className={`mt-1.5 flex items-center gap-3 px-3 py-2.5 rounded-xl border border-dashed text-sm cursor-pointer hover:bg-crimson-50 transition-colors ${
            fileError ? "border-red-400" : "border-crimson-300"
          }`}>
            <span className="px-3 py-1 rounded-lg bg-crimson-100 text-crimson-700 font-medium text-xs">Choose file</span>
            <span className="text-crimson-900/40">{form.fileName || "No file chosen"}</span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                setForm((f) => ({ ...f, fileName: e.target.files?.[0]?.name || "" }));
                setFileError("");
              }}
            />
          </label>
          {fileError && <p className="text-xs text-red-600 mt-1.5">{fileError}</p>}
        </div>
        <div>
          <label className="text-sm font-semibold text-crimson-950">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
            className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
        >
          <Upload size={16} /> Upload Report
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-crimson-100 p-6 mt-6">
        <div className="flex items-center gap-2 text-crimson-950 font-semibold mb-4">
          <FileText size={16} className="text-crimson-600" /> My Reports
        </div>
        {reports.length === 0 ? (
          <p className="text-sm text-crimson-900/40 text-center py-6">No reports uploaded yet</p>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {reports.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-3 rounded-xl border border-crimson-100"
                >
                  <div>
                    <p className="text-sm font-semibold text-crimson-950">{r.testType}</p>
                    <p className="text-xs text-crimson-900/40">
                      {testCategoryOf(r.testType)} &middot; {formatDate(r.testDate)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      r.result === "Negative"
                        ? "bg-emerald-50 text-emerald-700"
                        : r.result === "Positive"
                        ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {r.result === "Negative" ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    {r.result}
                  </span>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

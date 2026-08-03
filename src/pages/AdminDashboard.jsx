import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis, BarChart, Bar,
} from "recharts";
import { ShieldCheck } from "lucide-react";
import { db } from "../lib/db";
import { TEST_CATEGORIES, testCategoryOf } from "../lib/bloodUtils";

export default function AdminDashboard() {
  const reports = db.bloodTestReports.list();

  const diseaseByCategory = useMemo(() => {
    return TEST_CATEGORIES.map((cat) => ({
      category: cat.category.replace(" Disorders", "").replace(" Screening", ""),
      positive: reports.filter((r) => r.result === "Positive" && testCategoryOf(r.testType) === cat.category).length,
    }));
  }, [reports]);

  const diseaseByType = useMemo(() => {
    const positives = reports.filter((r) => r.result === "Positive");
    const counts = {};
    positives.forEach((r) => { counts[r.testType] = (counts[r.testType] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [reports]);

  const positiveCount = reports.filter((r) => r.result === "Positive").length;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl gradient-admin p-8 text-white flex items-center gap-4 relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/10 animate-drift" />
        <div className="relative z-10 w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
          <ShieldCheck size={26} />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl font-display font-bold">Admin Dashboard</h1>
          <p className="text-white/70 text-sm mt-1">Blood disease detection overview</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-sky-100 p-6">
        <h2 className="font-display font-semibold text-sky-950 mb-1">Blood Disease Detection Rate</h2>
        <p className="text-xs text-sky-900/40 mb-4">
          Positive findings by disorder category, across all {reports.length} uploaded report(s).
        </p>
        {positiveCount === 0 ? (
          <p className="text-sm text-sky-900/40 text-center py-16">No positive findings on record</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={diseaseByCategory} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" horizontal={false} />
              <XAxis type="number" allowDecimals={false} stroke="#0369a1" fontSize={12} />
              <YAxis type="category" dataKey="category" stroke="#0369a1" fontSize={11} width={140} />
              <Tooltip />
              <Bar dataKey="positive" name="Positive cases" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {diseaseByType.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl border border-sky-100 p-6">
          <h2 className="font-display font-semibold text-sky-950 mb-4">Positive Cases by Specific Condition</h2>
          <div className="flex flex-wrap gap-2">
            {diseaseByType.map((d) => (
              <span
                key={d.name}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-sky-50 text-sky-800 border border-sky-100"
              >
                {d.name}
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center">
                  {d.value}
                </span>
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

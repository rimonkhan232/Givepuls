import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Droplet, Users, Activity, HeartPulse, ArrowRight, Bell } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/db";
import StatCard from "../components/StatCard";
import BloodGroupBadge from "../components/BloodGroupBadge";
import KpiRing from "../components/KpiRing";
import { eligibleToDonate, formatDate, BLOOD_GROUPS } from "../lib/bloodUtils";

const GROUP_COLORS = ["#dc1530", "#b90f26", "#f13549", "#fb6672", "#8f0e24", "#f59e0b", "#0d9488", "#6b0e21"];

export default function Dashboard() {
  const { user } = useAuth();

  const profile = useMemo(
    () => db.donorProfiles.list().find((p) => p.userId === user.id),
    [user.id]
  );
  const donors = db.donorProfiles.list();
  const banks = db.bloodBanks.list();
  const requests = db.bloodRequests.filter((r) => r.status === "open");
  const myDonations = db.donations.filter((d) => d.donorId === profile?.id);

  const { eligible, daysLeft } = eligibleToDonate(profile?.lastDonationDate);

  const [requestTab, setRequestTab] = useState(profile?.division ? "nearby" : "all");
  const nearbyRequests = useMemo(
    () =>
      profile?.division
        ? requests.filter((r) =>
            r.location?.toLowerCase().includes(profile.division.toLowerCase())
          )
        : [],
    [requests, profile?.division]
  );
  const visibleRequests = requestTab === "nearby" ? nearbyRequests : requests;

  const donationTrend = useMemo(() => {
    const allDonations = db.donations.list();
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString("en", { month: "short" }), donations: 0 };
    });
    allDonations.forEach((don) => {
      const d = new Date(don.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const m = months.find((mo) => mo.key === key);
      if (m) m.donations += 1;
    });
    return months;
  }, []);

  const groupDistribution = useMemo(() => {
    const counts = {};
    donors.forEach((d) => {
      counts[d.bloodGroup] = (counts[d.bloodGroup] || 0) + 1;
    });
    return Object.entries(counts).map(([group, count]) => ({ group, count }));
  }, [donors]);

  const stockByGroup = useMemo(() => {
    const totals = Object.fromEntries(BLOOD_GROUPS.map((g) => [g, 0]));
    banks.forEach((b) => {
      Object.entries(b.stock || {}).forEach(([g, units]) => {
        totals[g] = (totals[g] || 0) + units;
      });
    });
    return BLOOD_GROUPS.map((g) => ({ group: g, units: totals[g] || 0 }));
  }, [banks]);

  const donorsInDivision = profile?.division
    ? donors.filter((d) => d.division === profile.division).length
    : donors.length;
  const myGroupStockNearby = profile?.bloodGroup
    ? banks
        .filter((b) => !profile.division || b.division === profile.division)
        .reduce((sum, b) => sum + (b.stock?.[profile.bloodGroup] || 0), 0)
    : 0;
  const eligibilityElapsed = profile?.lastDonationDate ? Math.max(0, 90 - daysLeft) : 90;

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl gradient-brand p-8 text-white relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 animate-drift" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-white/70 text-sm">Good to see you,</p>
            <h1 className="text-2xl sm:text-3xl font-display font-bold mt-1">{user.fullName}</h1>
            {profile && (
              <div className="flex items-center gap-3 mt-4">
                <BloodGroupBadge group={profile.bloodGroup} />
                <div>
                  <p className="text-sm font-medium">{profile.division}</p>
                  <p className="text-xs text-white/60">
                    {eligible ? "Eligible to donate now" : `${daysLeft} day(s) until eligible`}
                  </p>
                </div>
              </div>
            )}
          </div>
          <Link
            to="/requests"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-crimson-700 font-semibold text-sm hover:bg-crimson-50 transition-colors self-start"
          >
            View blood requests <ArrowRight size={16} />
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Donors nearby" value={donors.length} delay={0} />
        <StatCard icon={Droplet} label="Blood banks" value={banks.length} tint="bg-crimson-700" delay={0.05} />
        <StatCard icon={Activity} label="Open requests" value={requests.length} tint="bg-crimson-800" delay={0.1} />
        <StatCard icon={HeartPulse} label="Your donations" value={myDonations.length} tint="bg-crimson-900" delay={0.15} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl border border-crimson-100 p-6"
      >
        <div className="mb-5">
          <h2 className="font-display font-semibold text-crimson-950">Your impact overview</h2>
          <p className="text-xs text-crimson-900/50 mt-0.5">A snapshot of your donation progress and local blood supply</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
          <KpiRing
            value={myDonations.length}
            displayValue={myDonations.length}
            target={Math.max(5, myDonations.length + 1)}
            targetLabel={`Goal ${Math.max(5, myDonations.length + 1)}`}
            label="Your donations"
            color="#dc1530"
            delay={0}
          />
          <KpiRing
            value={eligibilityElapsed}
            displayValue={eligible ? "Ready" : `${daysLeft}d`}
            target={90}
            targetLabel="90 day cycle"
            label="Eligibility"
            color="#f59e0b"
            delay={0.05}
          />
          <KpiRing
            value={donorsInDivision}
            displayValue={donorsInDivision}
            target={Math.max(donors.length, donorsInDivision + 1)}
            targetLabel={profile?.division || "All divisions"}
            label="Donors nearby"
            color="#0d9488"
            delay={0.1}
          />
          <KpiRing
            value={nearbyRequests.length}
            displayValue={nearbyRequests.length}
            target={Math.max(requests.length, 1)}
            targetLabel="of open requests"
            label="Near you"
            color="#b90f26"
            delay={0.15}
          />
          <KpiRing
            value={myGroupStockNearby}
            displayValue={myGroupStockNearby}
            target={Math.max(myGroupStockNearby, 50)}
            targetLabel={profile?.bloodGroup ? `${profile.bloodGroup} units` : "units"}
            label="Bank stock"
            color="#8f0e24"
            delay={0.2}
          />
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-crimson-100 p-6"
        >
          <h2 className="font-display font-semibold text-crimson-950 mb-4">Donations over time</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={donationTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="donationFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dc1530" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#dc1530" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffe1e3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b0e21" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#6b0e21" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: "#ffe1e3", fontSize: 12 }}
                  labelStyle={{ color: "#3a0410", fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="donations" stroke="#dc1530" strokeWidth={2.5} fill="url(#donationFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-crimson-100 p-6"
        >
          <h2 className="font-display font-semibold text-crimson-950 mb-4">Donor blood groups</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={groupDistribution}
                  dataKey="count"
                  nameKey="group"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  {groupDistribution.map((entry, i) => (
                    <Cell key={entry.group} fill={GROUP_COLORS[i % GROUP_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#ffe1e3", fontSize: 12 }} />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, color: "#3a0410" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-crimson-100 p-6 overflow-x-auto"
        >
          <h2 className="font-display font-semibold text-crimson-950 mb-4">Open requests</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-crimson-900/40 border-b border-crimson-100">
                <th className="font-medium pb-2">Location</th>
                <th className="font-medium pb-2">Group</th>
                <th className="font-medium pb-2">Units</th>
                <th className="font-medium pb-2">Urgency</th>
                <th className="font-medium pb-2">Posted</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-crimson-900/40">No open requests right now.</td>
                </tr>
              )}
              {requests.slice(0, 6).map((r) => (
                <tr key={r.id} className="border-b border-crimson-50 last:border-0">
                  <td className="py-2.5 font-medium text-crimson-950">{r.location}</td>
                  <td className="py-2.5 text-crimson-900/70">{r.bloodGroup}</td>
                  <td className="py-2.5 text-crimson-900/70">{r.units}</td>
                  <td className="py-2.5">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        r.urgency === "Urgent" ? "bg-amber-100 text-amber-700" : "bg-crimson-50 text-crimson-700"
                      }`}
                    >
                      {r.urgency}
                    </span>
                  </td>
                  <td className="py-2.5 text-crimson-900/50">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-crimson-100 p-6"
        >
          <h2 className="font-display font-semibold text-crimson-950 mb-4">Blood bank stock by group</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockByGroup} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffe1e3" vertical={false} />
                <XAxis dataKey="group" tick={{ fontSize: 11, fill: "#6b0e21" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b0e21" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#ffe1e3", fontSize: 12 }} />
                <Bar dataKey="units" radius={[6, 6, 0, 0]}>
                  {stockByGroup.map((entry, i) => (
                    <Cell key={entry.group} fill={GROUP_COLORS[i % GROUP_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-crimson-100 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-crimson-950">Urgent requests</h2>
            <Link to="/requests" className="text-sm font-semibold text-crimson-700 hover:underline">
              See all
            </Link>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => setRequestTab("nearby")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                requestTab === "nearby"
                  ? "bg-crimson-700 text-white"
                  : "bg-crimson-50 text-crimson-800 hover:bg-crimson-100"
              }`}
            >
              In my area{profile?.division ? ` (${profile.division})` : ""}
            </button>
            <button
              type="button"
              onClick={() => setRequestTab("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                requestTab === "all"
                  ? "bg-crimson-700 text-white"
                  : "bg-crimson-50 text-crimson-800 hover:bg-crimson-100"
              }`}
            >
              All requests
            </button>
          </div>

          <div className="space-y-3">
            {visibleRequests.length === 0 && (
              <p className="text-sm text-crimson-900/50 py-6 text-center">
                {requestTab === "nearby"
                  ? "No open requests in your area right now."
                  : "No open requests right now."}
              </p>
            )}
            {visibleRequests.slice(0, 4).map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-4 p-3 rounded-xl border border-crimson-100 hover:bg-crimson-50/60 transition-colors"
              >
                <BloodGroupBadge group={r.bloodGroup} size="sm" pulse={r.urgency === "Urgent"} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-crimson-950">{r.location}</p>
                  <p className="text-xs text-crimson-900/50">
                    {r.units} unit(s) &middot; {r.requesterName} &middot; {formatDate(r.createdAt)}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    r.urgency === "Urgent" ? "bg-amber-100 text-amber-700" : "bg-crimson-50 text-crimson-700"
                  }`}
                >
                  {r.urgency}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-crimson-100 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} className="text-crimson-600" />
            <h2 className="font-display font-semibold text-crimson-950">Quick actions</h2>
          </div>
          <div className="space-y-2">
            <Link to="/requests" className="block px-4 py-3 rounded-xl bg-crimson-50 text-crimson-800 text-sm font-medium hover:bg-crimson-100 transition-colors">
              Post a blood request
            </Link>
            <Link to="/reports" className="block px-4 py-3 rounded-xl bg-crimson-50 text-crimson-800 text-sm font-medium hover:bg-crimson-100 transition-colors">
              Upload a test report
            </Link>
            <Link to="/compatibility" className="block px-4 py-3 rounded-xl bg-crimson-50 text-crimson-800 text-sm font-medium hover:bg-crimson-100 transition-colors">
              Check compatibility
            </Link>
            <Link to="/profile" className="block px-4 py-3 rounded-xl bg-crimson-50 text-crimson-800 text-sm font-medium hover:bg-crimson-100 transition-colors">
              Update availability
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

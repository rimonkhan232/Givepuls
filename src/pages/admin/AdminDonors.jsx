import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Phone, Users } from "lucide-react";
import { db } from "../../lib/db";
import { BLOOD_GROUPS, initials } from "../../lib/bloodUtils";

export default function AdminDonors() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");
  const donors = db.donorProfiles.list();

  const filtered = useMemo(() => {
    return donors.filter((d) => {
      const matchesQuery =
        !query ||
        d.fullName.toLowerCase().includes(query.toLowerCase()) ||
        d.division.toLowerCase().includes(query.toLowerCase());
      const matchesGroup = group === "All" || d.bloodGroup === group;
      return matchesQuery && matchesGroup;
    });
  }, [donors, query, group]);

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-sky-950">Donor Directory</h1>
          <p className="text-sm text-sky-900/50 mt-1">{filtered.length} of {donors.length} registered donor(s)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-sky-100 p-5 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or division..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
          />
        </div>
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-sky-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
        >
          <option value="All">All Blood Groups</option>
          {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-sky-900/40">
          <Users size={40} className="mx-auto mb-3" />
          <p>No donors match your filters.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((donor, i) => (
            <motion.div
              key={donor.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl border border-sky-100 p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center">
                    {initials(donor.fullName)}
                  </div>
                  <div>
                    <p className="font-semibold text-sky-950">{donor.fullName}</p>
                    <p className="text-xs text-sky-900/50 flex items-center gap-1">
                      <MapPin size={11} /> {donor.division}
                    </p>
                  </div>
                </div>
                <span className="w-9 h-9 rounded-xl bg-sky-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {donor.bloodGroup}
                </span>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-sky-100">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                    donor.available ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${donor.available ? "bg-emerald-500" : "bg-gray-400"}`} />
                  {donor.available ? "Available" : "Unavailable"}
                </span>
                {donor.phone && (
                  <span className="text-xs text-sky-900/50 flex items-center gap-1">
                    <Phone size={11} /> {donor.phone}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

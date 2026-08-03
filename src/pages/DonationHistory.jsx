import { motion } from "framer-motion";
import { CalendarClock, Droplet, MapPin } from "lucide-react";
import { db } from "../lib/db";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../lib/bloodUtils";
import BloodGroupBadge from "../components/BloodGroupBadge";

export default function DonationHistory() {
  const { user } = useAuth();
  const profile = db.donorProfiles.list().find((p) => p.userId === user.id);
  const donations = db.donations.filter((d) => d.donorId === profile?.id);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-display font-bold text-crimson-950">Donation History</h1>
      <p className="text-sm text-crimson-900/50 mt-1">A record of every time you've given blood through GivePulse.</p>

      {donations.length === 0 ? (
        <div className="text-center py-24 text-crimson-900/40">
          <CalendarClock size={40} className="mx-auto mb-3" />
          <p>No donations yet</p>
          <p className="text-sm mt-1">Your donation timeline will appear here once you help someone.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {donations.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-4 bg-white rounded-2xl border border-crimson-100 p-5"
            >
              <BloodGroupBadge group={d.bloodGroup} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-crimson-950 flex items-center gap-1.5">
                  <MapPin size={12} /> {d.location}
                </p>
                <p className="text-xs text-crimson-900/40 mt-1">{formatDate(d.createdAt)}</p>
              </div>
              <Droplet className="text-crimson-300" size={18} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

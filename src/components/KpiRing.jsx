import { motion } from "framer-motion";

/**
 * Circular KPI gauge: a progress ring with a value in the middle and a
 * label + target caption below, similar to a BI-dashboard "scorecard".
 */
export default function KpiRing({ value, displayValue, target, targetLabel, label, color = "#dc1530", delay = 0 }) {
  const size = 96;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = target ? Math.max(0, Math.min(1, value / target)) : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center text-center"
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-crimson-100"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - pct) }}
            transition={{ delay: delay + 0.1, duration: 0.9, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-display font-bold text-crimson-950">{displayValue}</span>
        </div>
      </div>
      {targetLabel && <p className="text-[11px] text-crimson-900/40 mt-2">{targetLabel}</p>}
      <p className="text-xs font-semibold text-crimson-900/70 mt-0.5">{label}</p>
    </motion.div>
  );
}

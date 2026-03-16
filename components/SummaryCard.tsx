"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/formatters";

interface SummaryCardProps {
  title: string;
  amount: string;
  subtitle?: string;
  icon?: string;
  gradient?: string;
}

export default function SummaryCard({
  title,
  amount,
  subtitle,
  icon = "💰",
  gradient = "from-action to-action-hover",
}: SummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="glass-strong rounded-xl p-6 relative overflow-hidden border border-gray-200"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-5 blur-3xl`} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <span className="text-2xl">{icon}</span>
        </div>
        
        <div className="mt-2">
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {formatCurrency(amount)}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

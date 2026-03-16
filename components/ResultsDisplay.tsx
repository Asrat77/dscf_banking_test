"use client";

import { motion } from "framer-motion";
import { SimulationResult } from "@/lib/api";
import SummaryCard from "./SummaryCard";
import DailyBreakdownTable from "./DailyBreakdownTable";
import AccountingRecords from "./AccountingRecords";
import BalanceChart from "./BalanceChart";
import InterestChart from "./InterestChart";

interface ResultsDisplayProps {
  result: SimulationResult;
}

export default function ResultsDisplay({ result }: ResultsDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Simulation Results</h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <SummaryCard
          title="Gross Interest"
          amount={result.gross_interest}
          subtitle="Total interest earned before tax"
          icon="💵"
          gradient="from-green-600 to-emerald-600"
        />
        <SummaryCard
          title="Tax Amount"
          amount={result.tax_amount}
          subtitle="5% withholding tax"
          icon="📊"
          gradient="from-amber-600 to-orange-600"
        />
        <SummaryCard
          title="Net Interest"
          amount={result.net_interest}
          subtitle="Interest credited to account"
          icon="✨"
          gradient="from-action to-action-hover"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <DailyBreakdownTable data={result.daily_breakdown} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <InterestChart data={result.daily_breakdown} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <BalanceChart data={result.daily_breakdown} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <AccountingRecords records={result.accounting_records} />
      </motion.div>
    </motion.div>
  );
}

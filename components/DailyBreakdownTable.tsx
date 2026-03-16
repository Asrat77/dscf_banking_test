"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DailyBreakdown } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface DailyBreakdownTableProps {
  data: DailyBreakdown[];
}

type SortField = "date" | "opening_balance" | "interest" | "closing_balance";
type SortDirection = "asc" | "desc";

export default function DailyBreakdownTable({ data }: DailyBreakdownTableProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let aValue: string | number = a[sortField];
    let bValue: string | number = b[sortField];

    if (sortField !== "date") {
      aValue = parseFloat(aValue as string);
      bValue = parseFloat(bValue as string);
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const cumulativeByDate = new Map<string, number>();
  let runningTotal = 0;
  const chronological = [...data].sort((a, b) => a.date.localeCompare(b.date));
  for (const day of chronological) {
    const dailyInterest = parseFloat(day.interest);
    runningTotal += Number.isFinite(dailyInterest) ? dailyInterest : 0;
    cumulativeByDate.set(day.date, runningTotal);
  }

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <span className="text-gray-500">⇅</span>;
    }
    return <span>{sortDirection === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-xl overflow-hidden border border-gray-200"
    >
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900">Daily Breakdown</h3>
        <p className="text-sm text-gray-600 mt-1">
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length} days
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Interest is shown separately from balance. Cumulative interest shows total earned over time.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th
                onClick={() => handleSort("date")}
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  Date {renderSortIcon("date")}
                </div>
              </th>
              <th
                onClick={() => handleSort("opening_balance")}
                className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-end gap-2">
                  Opening Balance {renderSortIcon("opening_balance")}
                </div>
              </th>
              <th
                onClick={() => handleSort("interest")}
                className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-end gap-2">
                  Interest {renderSortIcon("interest")}
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Cumulative Interest
              </th>
              <th
                onClick={() => handleSort("closing_balance")}
                className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-end gap-2">
                  Closing Balance {renderSortIcon("closing_balance")}
                </div>
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                Rate
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.map((day, index) => (
              <motion.tr
                key={day.date}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(day.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right font-mono">
                  {formatCurrency(day.opening_balance)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right font-mono">
                  +{formatCurrency(day.interest)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right font-mono">
                  {formatCurrency(cumulativeByDate.get(day.date) ?? 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono font-semibold">
                  {formatCurrency(day.closing_balance)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                  {day.rate_used}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 rounded-lg text-sm transition-colors"
          >
            Previous
          </button>
          
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  currentPage === page
                    ? "bg-workbench-600 text-white"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 rounded-lg text-sm transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </motion.div>
  );
}

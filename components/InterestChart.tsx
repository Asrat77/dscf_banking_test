"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { DailyBreakdown } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/formatters";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface InterestChartProps {
  data: DailyBreakdown[];
}

export default function InterestChart({ data }: InterestChartProps) {
  const chartRef = useRef<ChartJS<"line">>(null);

  let runningTotal = 0;
  const cumulative = data.map((day) => {
    const daily = parseFloat(day.interest);
    runningTotal += Number.isFinite(daily) ? daily : 0;
    return runningTotal;
  });

  const chartData = {
    labels: data.map((day) => formatDate(day.date)),
    datasets: [
      {
        label: "Cumulative Interest",
        data: cumulative,
        borderColor: "rgb(14, 116, 144)",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, "rgba(14, 116, 144, 0.35)");
          gradient.addColorStop(1, "rgba(14, 116, 144, 0)");
          return gradient;
        },
        borderWidth: 3,
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "rgb(14, 116, 144)",
        pointHoverBorderColor: "white",
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        titleColor: "#0f172a",
        bodyColor: "#0f172a",
        borderColor: "rgba(14, 116, 144, 0.35)",
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: (context) => context[0].label,
          label: (context) => {
            return `Cumulative interest: ${formatCurrency(context.parsed.y ?? 0)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
          drawTicks: false,
        },
        ticks: {
          color: "rgba(0, 0, 0, 0.6)",
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 11,
          },
          maxTicksLimit: 10,
        },
        border: {
          display: false,
        },
      },
      y: {
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
          drawTicks: false,
        },
        ticks: {
          color: "rgba(0, 0, 0, 0.6)",
          font: {
            size: 11,
          },
          callback: (value) => `ETB ${(value as number).toLocaleString()}`,
        },
        border: {
          display: false,
        },
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-xl p-6 border border-gray-200"
    >
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">Interest Over Time</h3>
        <p className="text-sm text-gray-600 mt-1">
          Cumulative interest earned across the simulation period
        </p>
      </div>

      <div className="h-80 md:h-96">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
    </motion.div>
  );
}

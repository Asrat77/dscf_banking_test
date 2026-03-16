"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSimulation } from "@/hooks/useSimulation";
import SimulationForm from "@/components/SimulationForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import { getAccessToken } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const token = getAccessToken();

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [router, token]);

  const {
    formData,
    setFormData,
    result,
    isLoading,
    error,
    submitSimulation,
    resetSimulation,
  } = useSimulation();

  if (!token) {
    return null;
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[var(--bg-app)]">
      {/* Sticky Left Rail - Scenario Configuration */}
      <aside className="w-full lg:w-[420px] lg:h-screen lg:sticky lg:top-0 border-b lg:border-b-0 lg:border-r border-[var(--border-panel)] bg-[var(--bg-panel)] overflow-y-auto z-10 shadow-panel">
        <div className="p-6">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-workbench-900 tracking-tight">QA Workbench</h1>
              <p className="text-xs text-workbench-500 font-mono mt-1">v2.0.0 • Interest Sim</p>
            </div>
            <button 
              onClick={resetSimulation}
              className="text-xs font-medium text-action hover:text-action-hover transition-colors"
              title="Reset Scenario"
            >
              Reset
            </button>
          </header>

          <div className="space-y-6 animate-enter-rail">
            <div className="bg-workbench-50 rounded-lg p-4 border border-workbench-200">
              <h2 className="text-xs font-semibold text-workbench-500 uppercase tracking-wider mb-3">
                Scenario Inputs
              </h2>
              <SimulationForm
                formData={formData}
                onChange={setFormData}
                onSubmit={submitSimulation}
                isLoading={isLoading}
              />
            </div>
            
            <div className="text-xs text-workbench-400 text-center">
              <p>Configure account parameters and transaction stream to generate interest forecast.</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace - Results & Visualization */}
      <main className="flex-1 min-w-0 bg-[var(--bg-app)] relative">
        <div className="max-w-5xl mx-auto p-6 lg:p-10 animate-enter-workspace">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 flex items-start gap-3 shadow-sm"
              >
                <span className="text-lg">⚠️</span>
                <div>
                  <h3 className="font-semibold text-sm">Simulation Error</h3>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </motion.div>
            )}

            {result ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-[var(--bg-panel)] rounded-xl shadow-card border border-[var(--border-panel)] overflow-hidden"
              >
                <div className="border-b border-[var(--border-panel)] bg-workbench-50/50 px-6 py-4 flex justify-between items-center">
                  <h2 className="font-semibold text-workbench-900">Simulation Report</h2>
                  <span className="text-xs font-mono text-workbench-500 bg-workbench-200/50 px-2 py-1 rounded">
                    Generated: {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <div className="p-6 lg:p-8">
                  <ResultsDisplay result={result} />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 border-2 border-dashed border-workbench-200 rounded-xl"
              >
                <div className="w-16 h-16 bg-workbench-100 rounded-2xl flex items-center justify-center mb-6 text-2xl shadow-sm">
                  📊
                </div>
                <h3 className="text-lg font-medium text-workbench-900 mb-2">
                  Ready to Simulate
                </h3>
                <p className="text-workbench-500 max-w-md mx-auto mb-8 text-sm leading-relaxed">
                  Enter an account number and date range in the left panel to initialize a simulation.
                  You can compare interest accrual across different transaction scenarios.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl text-left">
                   <div className="p-4 rounded-lg bg-white border border-workbench-200 shadow-sm">
                     <span className="block text-action mb-2 text-lg">✓</span>
                     <h4 className="font-medium text-sm text-workbench-900">Real-time Validation</h4>
                     <p className="text-xs text-workbench-500 mt-1">Instant feedback on input constraints</p>
                   </div>
                   <div className="p-4 rounded-lg bg-white border border-workbench-200 shadow-sm">
                     <span className="block text-action mb-2 text-lg">✓</span>
                     <h4 className="font-medium text-sm text-workbench-900">Daily Breakdown</h4>
                     <p className="text-xs text-workbench-500 mt-1">Granular view of balance and accrual</p>
                   </div>
                   <div className="p-4 rounded-lg bg-white border border-workbench-200 shadow-sm">
                     <span className="block text-action mb-2 text-lg">✓</span>
                     <h4 className="font-medium text-sm text-workbench-900">Accounting Records</h4>
                     <p className="text-xs text-workbench-500 mt-1">Audit-ready journal entries</p>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}


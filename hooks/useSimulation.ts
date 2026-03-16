import { useState, useCallback } from "react";
import { runSimulation, SimulationRequest, SimulationResult, ApiResponse } from "@/lib/api";
import { Transaction } from "@/lib/validation";

export interface SimulationFormData {
  accountId: string;
  initialBalance: string;
  startDate: string;
  endDate: string;
  transactions: Transaction[];
}

export interface UseSimulationReturn {
  formData: SimulationFormData;
  setFormData: React.Dispatch<React.SetStateAction<SimulationFormData>>;
  result: SimulationResult | null;
  isLoading: boolean;
  error: string | null;
  submitSimulation: (resolvedInitialBalance?: number) => Promise<void>;
  resetSimulation: () => void;
  updateField: <K extends keyof SimulationFormData>(
    field: K,
    value: SimulationFormData[K]
  ) => void;
}

const initialFormData: SimulationFormData = {
  accountId: "",
  initialBalance: "",
  startDate: "",
  endDate: "",
  transactions: [],
};

export function useSimulation(): UseSimulationReturn {
  const [formData, setFormData] = useState<SimulationFormData>(initialFormData);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = useCallback(
    <K extends keyof SimulationFormData>(field: K, value: SimulationFormData[K]) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const submitSimulation = useCallback(async (resolvedInitialBalance?: number) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const initialBalanceValue =
        resolvedInitialBalance ?? parseFloat(formData.initialBalance);
      const request: SimulationRequest = {
        account_number: formData.accountId,
        initial_balance: initialBalanceValue,
        start_date: formData.startDate,
        end_date: formData.endDate,
        transactions: formData.transactions.map((tx) => ({
          date: tx.date,
          amount: tx.amount,
          type: tx.type,
        })),
      };

      const response: ApiResponse<SimulationResult> = await runSimulation(request);

      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Simulation error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  const resetSimulation = useCallback(() => {
    setFormData(initialFormData);
    setResult(null);
    setError(null);
  }, []);

  return {
    formData,
    setFormData,
    result,
    isLoading,
    error,
    submitSimulation,
    resetSimulation,
    updateField,
  };
}

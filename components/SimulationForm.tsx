"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { SimulationFormData } from "@/hooks/useSimulation";
import {
  Transaction,
  validateInitialBalance,
  validateDateRange,
  validateRequiredField,
  validateTransactions,
} from "@/lib/validation";
import {
  Account,
  InterestConfiguration,
  InterestRateTier,
  fetchAccounts,
  fetchInterestConfigurations,
  fetchInterestRateTiers,
} from "@/lib/api";
export type InterestPanelState = {
  config: InterestConfiguration | null;
  tiers: InterestRateTier[];
  isLoading: boolean;
  error: string | null;
  hasMultipleActive: boolean;
  hasSelection: boolean;
};

interface SimulationFormProps {
  formData: SimulationFormData;
  onChange: (data: SimulationFormData) => void;
  onSubmit: (resolvedInitialBalance?: number) => void;
  isLoading: boolean;
  onInterestStateChange?: (state: InterestPanelState) => void;
  onInterestReloadReady?: (reload: () => void) => void;
  onTransactionsError?: (message: string | null) => void;
}

export default function SimulationForm({
  formData,
  onChange,
  onSubmit,
  isLoading,
  onInterestStateChange,
  onInterestReloadReady,
  onTransactionsError,
}: SimulationFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isAccountsLoading, setIsAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [interestConfig, setInterestConfig] = useState<InterestConfiguration | null>(null);
  const [interestTiers, setInterestTiers] = useState<InterestRateTier[]>([]);
  const [isInterestLoading, setIsInterestLoading] = useState(false);
  const [interestError, setInterestError] = useState<string | null>(null);
  const [hasMultipleActiveConfigs, setHasMultipleActiveConfigs] = useState(false);
  const loadAccounts = useCallback(async () => {
    setIsAccountsLoading(true);
    setAccountsError(null);

    const response = await fetchAccounts();
    if (response.success) {
      setAccounts(response.data);
    } else {
      setAccountsError(response.error || "Failed to load accounts.");
    }

    setIsAccountsLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAccounts();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadAccounts]);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.account_number === formData.accountId),
    [accounts, formData.accountId]
  );
  const selectedProductId =
    selectedAccount?.virtual_account_product?.id ?? selectedAccount?.virtual_account_product_id ?? null;
  const accountBalanceValue =
    selectedAccount?.current_balance != null
      ? Number(selectedAccount.current_balance)
      : null;

  useEffect(() => {
    if (!selectedAccount) {
      return;
    }

    if (formData.initialBalance) {
      return;
    }

    if (accountBalanceValue == null || Number.isNaN(accountBalanceValue)) {
      return;
    }

    onChange({
      ...formData,
      initialBalance: accountBalanceValue.toFixed(2),
    });
  }, [accountBalanceValue, formData, onChange, selectedAccount]);

  const resetInterestState = useCallback(() => {
    setInterestConfig(null);
    setInterestTiers([]);
    setHasMultipleActiveConfigs(false);
    setInterestError(null);
    setIsInterestLoading(false);
  }, []);

  const loadInterestConfiguration = useCallback(async () => {
    if (!selectedProductId) {
      resetInterestState();
      return;
    }

    setIsInterestLoading(true);
    setInterestError(null);
    setHasMultipleActiveConfigs(false);

    const response = await fetchInterestConfigurations(selectedProductId);

    if (!response.success) {
      setInterestConfig(null);
      setInterestTiers([]);
      setInterestError(response.error || "Failed to load interest configuration.");
      setIsInterestLoading(false);
      return;
    }

    const configs = response.data || [];
    if (configs.length === 0) {
      setInterestConfig(null);
      setInterestTiers([]);
      setHasMultipleActiveConfigs(false);
      setIsInterestLoading(false);
      return;
    }

    const [config] = configs;
    setInterestConfig(config);
    setHasMultipleActiveConfigs(configs.length > 1);

    if (config?.id) {
      const tiersResponse = await fetchInterestRateTiers(config.id);
      if (tiersResponse.success) {
        setInterestTiers(tiersResponse.data || []);
      } else {
        setInterestTiers([]);
        setInterestError(tiersResponse.error || "Failed to load interest tiers.");
      }
    } else {
      setInterestTiers([]);
    }

    setIsInterestLoading(false);
  }, [resetInterestState, selectedProductId]);

  useEffect(() => {
    if (!selectedProductId) {
      resetInterestState();
      return;
    }

    void loadInterestConfiguration();
  }, [loadInterestConfiguration, resetInterestState, selectedProductId]);

  useEffect(() => {
    onInterestStateChange?.({
      config: interestConfig,
      tiers: interestTiers,
      isLoading: isInterestLoading,
      error: interestError,
      hasMultipleActive: hasMultipleActiveConfigs,
      hasSelection: Boolean(formData.accountId),
    });
  }, [
    hasMultipleActiveConfigs,
    interestConfig,
    interestError,
    interestTiers,
    isInterestLoading,
    formData.accountId,
    onInterestStateChange,
  ]);

  useEffect(() => {
    onTransactionsError?.(errors.transactions ?? null);
  }, [errors.transactions, onTransactionsError]);

  useEffect(() => {
    onInterestReloadReady?.(loadInterestConfiguration);
  }, [loadInterestConfiguration, onInterestReloadReady]);

  const updateField = (field: keyof SimulationFormData, value: string | Transaction[]) => {
    onChange({
      ...formData,
      [field]: value,
    });
    
    const newErrors = { ...errors };
    delete newErrors[field];
    setErrors(newErrors);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const accountValidation = validateRequiredField(formData.accountId);
    if (!accountValidation.isValid) {
      newErrors.accountId = "Account number is required";
    }

    if (formData.initialBalance) {
      const balanceValidation = validateInitialBalance(formData.initialBalance);
      if (!balanceValidation.isValid) {
        newErrors.initialBalance = balanceValidation.error || "";
      }
    } else if (accountBalanceValue == null || Number.isNaN(accountBalanceValue)) {
      newErrors.initialBalance = "Initial balance is required when account balance is unavailable.";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }

    if (formData.startDate && formData.endDate) {
      const dateValidation = validateDateRange(formData.startDate, formData.endDate);
      if (!dateValidation.isValid) {
        newErrors.dateRange = dateValidation.error || "";
      }

      const transactionsValidation = validateTransactions(
        formData.transactions,
        formData.startDate,
        formData.endDate
      );
      if (!transactionsValidation.isValid) {
        newErrors.transactions = transactionsValidation.error || "";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const resolvedInitialBalance = formData.initialBalance
        ? parseFloat(formData.initialBalance)
        : accountBalanceValue ?? undefined;
      onSubmit(resolvedInitialBalance);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-2xl p-8 shadow-lg"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Interest Simulation
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-2">
            Select Account <span className="text-red-600">*</span>
          </label>
          <select
            id="accountId"
            value={formData.accountId}
            onChange={(e) => updateField("accountId", e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent transition-all"
            disabled={isLoading || isAccountsLoading}
          >
            <option value="">
              {isAccountsLoading ? "Loading accounts..." : "Choose an account"}
            </option>
            {accounts.map((account) => (
              <option key={account.id} value={account.account_number}>
                {account.account_number}
                {account.customer_name
                  ? ` - ${account.customer_name}`
                  : account.name
                    ? ` - ${account.name}`
                    : ""}
              </option>
            ))}
          </select>
          {accountsError && (
            <p className="mt-1 text-sm text-red-600">{accountsError}</p>
          )}
          {errors.accountId && (
            <p className="mt-1 text-sm text-red-600">{errors.accountId}</p>
          )}
        </div>

        <div>
          <label htmlFor="initialBalance" className="block text-sm font-medium text-gray-700 mb-2">
            Initial Balance (ETB) <span className="text-red-600">*</span>
          </label>
          <input
            id="initialBalance"
            type="number"
            step="0.01"
            min="0"
            value={formData.initialBalance}
            onChange={(e) => updateField("initialBalance", e.target.value)}
            placeholder="10000.00"
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Defaults to account balance if left blank.
          </p>
          {errors.initialBalance && (
            <p className="mt-1 text-sm text-red-600">{errors.initialBalance}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date <span className="text-red-600">*</span>
            </label>
            <input
              id="simulationStartDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => updateField("startDate", e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent transition-all"
              disabled={isLoading}
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
            )}
          </div>

          <div>
            <label htmlFor="simulationEndDate" className="block text-sm font-medium text-gray-700 mb-2">
              End Date <span className="text-red-600">*</span>
            </label>
            <input
              id="simulationEndDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => updateField("endDate", e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent transition-all"
              disabled={isLoading}
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
            )}
          </div>
        </div>

        {errors.dateRange && (
          <p className="text-sm text-red-600">{errors.dateRange}</p>
        )}

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Running Simulation...
              </span>
            ) : (
              "Run Simulation"
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

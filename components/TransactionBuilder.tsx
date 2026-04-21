"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Transaction, validateTransactionDate, validateAmount } from "@/lib/validation";
import { formatDateForInput, formatCurrency } from "@/lib/formatters";

interface TransactionBuilderProps {
  transactions: Transaction[];
  onChange: (transactions: Transaction[]) => void;
  startDate: string;
  endDate: string;
}

export default function TransactionBuilder({
  transactions,
  onChange,
  startDate,
  endDate,
}: TransactionBuilderProps) {
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [addTransactionError, setAddTransactionError] = useState("");
  const startDateId = "simulationStartDate";
  const endDateId = "simulationEndDate";

  const addTransaction = () => {
    if (!startDate || !endDate) {
      setAddTransactionError("Set simulation start and end dates before adding transactions.");
      const target = document.getElementById(startDate ? endDateId : startDateId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.focus();
      }
      return;
    }

    const newTransaction: Transaction = {
      date: startDate,
      amount: 0.01,
      type: "deposit",
    };
    setAddTransactionError("");
    onChange([...transactions, newTransaction]);
  };

  const removeTransaction = (index: number) => {
    const newTransactions = transactions.filter((_, i) => i !== index);
    onChange(newTransactions);
    
    // Create new errors object with adjusted indices
    const newErrors: Record<number, string> = {};
    Object.keys(errors).forEach((key) => {
        const errorIndex = parseInt(key);
        if (errorIndex < index) {
            newErrors[errorIndex] = errors[errorIndex];
        } else if (errorIndex > index) {
            newErrors[errorIndex - 1] = errors[errorIndex];
        }
        // If errorIndex === index, it is intentionally dropped
    });

    setErrors(newErrors);
  };

  const updateTransaction = (
    index: number,
    field: keyof Transaction,
    value: string | number
  ) => {
    const newTransactions = [...transactions];
    
    if (field === "amount") {
      newTransactions[index][field] = typeof value === "string" ? parseFloat(value) || 0 : value;
    } else if (field === "type") {
      newTransactions[index][field] = value as "deposit" | "withdrawal";
    } else {
      newTransactions[index][field] = value as string;
    }
    
    onChange(newTransactions);
    validateTransaction(index, newTransactions[index]);
  };

  const validateTransaction = (index: number, transaction: Transaction) => {
    const newErrors = { ...errors };
    
    if (!transaction.date) {
      newErrors[index] = "Date is required";
      setErrors(newErrors);
      return;
    }
    
    if (!transaction.amount || transaction.amount <= 0) {
      newErrors[index] = "Amount must be greater than zero";
      setErrors(newErrors);
      return;
    }
    
    if (startDate && endDate) {
      const dateValidation = validateTransactionDate(transaction.date, startDate, endDate);
      if (!dateValidation.isValid) {
        newErrors[index] = dateValidation.error || "Invalid date";
        setErrors(newErrors);
        return;
      }
    }
    
    const amountValidation = validateAmount(transaction.amount);
    if (!amountValidation.isValid) {
      newErrors[index] = amountValidation.error || "Invalid amount";
      setErrors(newErrors);
      return;
    }
    
    delete newErrors[index];
    setErrors(newErrors);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Transactions (Optional)
        </label>
        <button
          type="button"
          onClick={addTransaction}
          className="btn-primary text-sm gap-2"
        >
          <span>+</span>
          Add Transaction
        </button>
      </div>

      {addTransactionError && (
        <p className="text-xs text-red-600">{addTransactionError}</p>
      )}

      <AnimatePresence mode="popLayout">
        {transactions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8 text-gray-500 text-sm"
          >
            No transactions added. Click &quot;Add Transaction&quot; to add one.
          </motion.div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.2 }}
                className="glass rounded-lg p-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formatDateForInput(transaction.date)}
                      onChange={(e) => updateTransaction(index, "date", e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={transaction.amount || ""}
                      onChange={(e) => updateTransaction(index, "amount", e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateTransaction(index, "type", "deposit")}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        transaction.type === "deposit"
                          ? "btn-toggle-positive shadow-md"
                          : "btn-secondary text-gray-700"
                      }`}
                    >
                      Deposit
                    </button>
                    <button
                      type="button"
                      onClick={() => updateTransaction(index, "type", "withdrawal")}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        transaction.type === "withdrawal"
                          ? "btn-toggle-negative shadow-md"
                          : "btn-secondary text-gray-700"
                      }`}
                    >
                      Withdrawal
                    </button>
                  </div>
                </div>

                  <div className="md:col-span-2 flex items-end">
                    <button
                      type="button"
                      onClick={() => removeTransaction(index)}
                      className="btn-secondary w-full text-sm text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {errors[index] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2 text-xs text-red-600"
                  >
                    {errors[index]}
                  </motion.div>
                )}

                {!errors[index] && transaction.amount > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    {transaction.type === "deposit" ? "+" : "-"}{formatCurrency(transaction.amount)}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

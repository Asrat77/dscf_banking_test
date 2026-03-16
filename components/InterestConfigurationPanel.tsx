"use client";

import { InterestConfiguration, InterestRateTier } from "@/lib/api";
import { formatCurrency, formatDate, formatPercentage } from "@/lib/formatters";

interface InterestConfigurationPanelProps {
  config: InterestConfiguration | null;
  tiers: InterestRateTier[];
  isLoading: boolean;
  error: string | null;
  hasMultipleActive: boolean;
  hasSelection: boolean;
  onReload: () => void;
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatRate(value: number | string | null | undefined): string {
  const parsed = toNumber(value);
  if (parsed === null) return "-";
  return formatPercentage(parsed * 100);
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export default function InterestConfigurationPanel({
  config,
  tiers,
  isLoading,
  error,
  hasMultipleActive,
  hasSelection,
  onReload,
}: InterestConfigurationPanelProps) {
  return (
    <div className="rounded-lg border border-workbench-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold text-workbench-500 uppercase tracking-wider">
            Interest Configuration
          </h3>
          <p className="text-xs text-workbench-400 mt-1">
            Active configuration linked to the selected account product.
          </p>
        </div>
        <button
          type="button"
          onClick={onReload}
          className="btn-secondary text-xs"
          disabled={isLoading}
        >
          Reload
        </button>
      </div>

      {hasMultipleActive && (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Multiple active configurations found. Showing the first one.
        </div>
      )}

      {isLoading && (
        <p className="mt-3 text-xs text-workbench-500">Loading interest configuration...</p>
      )}

      {error && (
        <p className="mt-3 text-xs text-red-700">{error}</p>
      )}

      {!hasSelection && !isLoading && !error && (
        <p className="mt-3 text-xs text-workbench-500">
          Select an account to load its interest configuration.
        </p>
      )}

      {hasSelection && !isLoading && !error && !config && (
        <p className="mt-3 text-xs text-workbench-500">
          No active interest configuration for this product.
        </p>
      )}

      {!isLoading && config && (
        <div className="mt-4 space-y-4">
          {config.calculation_method === "simple" && (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
              Simple interest is enabled. Daily interest stays flat when the balance does not change.
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-workbench-700">Product</p>
            <p className="text-sm text-workbench-900">
              {config.virtual_account_product?.product_name ||
                config.virtual_account_product?.product_code ||
                `Product #${config.virtual_account_product_id}`}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-workbench-700">Interest Rate Type</p>
            <p className="text-sm text-workbench-900">
              {config.interest_rate_type?.name ||
                config.interest_rate_type?.code ||
                `Type #${config.interest_rate_type_id}`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-workbench-500">Annual Rate</p>
              <p className="text-workbench-900 font-medium">{formatRate(config.annual_interest_rate)}</p>
            </div>
            <div>
              <p className="text-workbench-500">Income Tax</p>
              <p className="text-workbench-900 font-medium">{formatRate(config.income_tax_rate)}</p>
            </div>
            <div>
              <p className="text-workbench-500">Min Balance</p>
              <p className="text-workbench-900 font-medium">
                {config.minimum_balance_for_interest != null
                  ? formatCurrency(config.minimum_balance_for_interest)
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-workbench-500">Active</p>
              <p className="text-workbench-900 font-medium">
                {config.is_active ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <p className="text-workbench-500">Calculation</p>
              <p className="text-workbench-900 font-medium">
                {config.calculation_method || "-"}
              </p>
            </div>
            <div>
              <p className="text-workbench-500">Compounding</p>
              <p className="text-workbench-900 font-medium">
                {config.compounding_period || "-"}
              </p>
            </div>
            <div>
              <p className="text-workbench-500">Interest Basis</p>
              <p className="text-workbench-900 font-medium">
                {config.interest_basis || "-"}
              </p>
            </div>
            <div>
              <p className="text-workbench-500">Accrual Frequency</p>
              <p className="text-workbench-900 font-medium">
                {config.accrual_frequency || "-"}
              </p>
            </div>
            <div>
              <p className="text-workbench-500">Rounding Rule</p>
              <p className="text-workbench-900 font-medium">
                {config.rounding_rule || "-"}
              </p>
            </div>
            <div>
              <p className="text-workbench-500">Calculation Timing</p>
              <p className="text-workbench-900 font-medium">
                {formatDateTime(config.calculation_timing)}
              </p>
            </div>
            <div>
              <p className="text-workbench-500">Promo Start</p>
              <p className="text-workbench-900 font-medium">
                {config.promotional_start_date ? formatDate(config.promotional_start_date) : "-"}
              </p>
            </div>
            <div>
              <p className="text-workbench-500">Promo End</p>
              <p className="text-workbench-900 font-medium">
                {config.promotional_end_date ? formatDate(config.promotional_end_date) : "-"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-workbench-700 mb-2">Rate Tiers</p>
            {tiers.length === 0 ? (
              <p className="text-xs text-workbench-500">No tiers configured.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-workbench-200">
                  <thead className="bg-workbench-50">
                    <tr>
                      <th className="px-2 py-2 text-left font-semibold text-workbench-600">Tier</th>
                      <th className="px-2 py-2 text-left font-semibold text-workbench-600">Min</th>
                      <th className="px-2 py-2 text-left font-semibold text-workbench-600">Max</th>
                      <th className="px-2 py-2 text-left font-semibold text-workbench-600">Rate</th>
                      <th className="px-2 py-2 text-left font-semibold text-workbench-600">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiers.map((tier) => (
                      <tr key={tier.id} className="border-t border-workbench-200">
                        <td className="px-2 py-2 text-workbench-900">{tier.tier_order}</td>
                        <td className="px-2 py-2 text-workbench-900">
                          {formatCurrency(tier.balance_min)}
                        </td>
                        <td className="px-2 py-2 text-workbench-900">
                          {tier.balance_max != null ? formatCurrency(tier.balance_max) : "No limit"}
                        </td>
                        <td className="px-2 py-2 text-workbench-900">
                          {formatRate(tier.interest_rate)}
                        </td>
                        <td className="px-2 py-2 text-workbench-700">
                          {tier.description || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

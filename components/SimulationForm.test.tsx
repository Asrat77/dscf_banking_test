import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import SimulationForm from "./SimulationForm";
import type { SimulationFormData } from "@/hooks/useSimulation";

const { fetchAccountsMock, fetchInterestConfigurationsMock, fetchInterestRateTiersMock } = vi.hoisted(() => ({
  fetchAccountsMock: vi.fn(),
  fetchInterestConfigurationsMock: vi.fn(),
  fetchInterestRateTiersMock: vi.fn(),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");

  return {
    ...actual,
    fetchAccounts: fetchAccountsMock,
    fetchInterestConfigurations: fetchInterestConfigurationsMock,
    fetchInterestRateTiers: fetchInterestRateTiersMock,
  };
});

describe("SimulationForm", () => {
  beforeEach(() => {
    fetchAccountsMock.mockResolvedValue({ success: true, data: [] });
    fetchAccountsMock.mockClear();
    fetchInterestConfigurationsMock.mockResolvedValue({ success: true, data: [] });
    fetchInterestConfigurationsMock.mockClear();
    fetchInterestRateTiersMock.mockResolvedValue({ success: true, data: [] });
    fetchInterestRateTiersMock.mockClear();
  });

  it("does not submit when a transaction row is invalid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    const formData: SimulationFormData = {
      accountId: "100001",
      initialBalance: "1000",
      startDate: "2026-03-01",
      endDate: "2026-03-10",
      transactions: [
        {
          date: "2026-03-03",
          amount: 0,
          type: "deposit",
        },
      ],
    };

    render(
      <SimulationForm
        formData={formData}
        onChange={vi.fn()}
        onSubmit={onSubmit}
        isLoading={false}
      />
    );

    await waitFor(() => expect(fetchAccountsMock).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /run simulation/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Transaction 1: Amount must be greater than zero")).toBeInTheDocument();
  });

  it("shows out-of-range transaction date feedback", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    const formData: SimulationFormData = {
      accountId: "100001",
      initialBalance: "1000",
      startDate: "2026-03-05",
      endDate: "2026-03-10",
      transactions: [
        {
          date: "2026-03-03",
          amount: 100,
          type: "deposit",
        },
      ],
    };

    render(
      <SimulationForm
        formData={formData}
        onChange={vi.fn()}
        onSubmit={onSubmit}
        isLoading={false}
      />
    );

    await waitFor(() => expect(fetchAccountsMock).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /run simulation/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Transaction 1: Transaction date must be after simulation start date")).toBeInTheDocument();
  });

  it("shows no active configuration message when none exists", async () => {
    fetchAccountsMock.mockResolvedValue({
      success: true,
      data: [
        {
          id: 1,
          account_number: "100001",
          virtual_account_product_id: 99,
        },
      ],
    });
    fetchInterestConfigurationsMock.mockResolvedValue({ success: true, data: [] });

    const formData: SimulationFormData = {
      accountId: "100001",
      initialBalance: "1000",
      startDate: "2026-03-01",
      endDate: "2026-03-10",
      transactions: [],
    };

    render(
      <SimulationForm
        formData={formData}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        isLoading={false}
      />
    );

    await waitFor(() => expect(fetchInterestConfigurationsMock).toHaveBeenCalled());

    expect(
      screen.getByText("No active interest configuration for this product.")
    ).toBeInTheDocument();
  });

  it("renders configuration and tiers when available", async () => {
    fetchAccountsMock.mockResolvedValue({
      success: true,
      data: [
        {
          id: 1,
          account_number: "100001",
          virtual_account_product_id: 99,
        },
      ],
    });
    fetchInterestConfigurationsMock.mockResolvedValue({
      success: true,
      data: [
        {
          id: 10,
          virtual_account_product_id: 99,
          interest_rate_type_id: 3,
          annual_interest_rate: 0.12,
          income_tax_rate: 0.05,
          minimum_balance_for_interest: 1000,
          calculation_method: "simple",
          compounding_period: "monthly",
          interest_basis: "actual_365",
          accrual_frequency: "monthly",
          rounding_rule: "nearest_cent",
          calculation_timing: "2026-03-01T00:00:00Z",
          promotional_start_date: "2026-03-01",
          promotional_end_date: "2026-03-31",
          is_active: true,
          interest_rate_type: { id: 3, name: "Fixed" },
          virtual_account_product: { id: 99, product_name: "Savings Plus" },
        },
      ],
    });
    fetchInterestRateTiersMock.mockResolvedValue({
      success: true,
      data: [
        {
          id: 7,
          tier_order: 1,
          balance_min: 0,
          balance_max: 10000,
          interest_rate: 0.1,
          description: "Tier 1",
        },
      ],
    });

    const formData: SimulationFormData = {
      accountId: "100001",
      initialBalance: "1000",
      startDate: "2026-03-01",
      endDate: "2026-03-10",
      transactions: [],
    };

    render(
      <SimulationForm
        formData={formData}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        isLoading={false}
      />
    );

    await waitFor(() => expect(fetchInterestRateTiersMock).toHaveBeenCalled());

    expect(screen.getByText("Savings Plus")).toBeInTheDocument();
    expect(screen.getByText("Fixed")).toBeInTheDocument();
    expect(screen.getByText("Tier 1")).toBeInTheDocument();
  });

  it("auto-fills initial balance from account balance when empty", async () => {
    fetchAccountsMock.mockResolvedValue({
      success: true,
      data: [
        {
          id: 1,
          account_number: "100001",
          current_balance: "2500.50",
          virtual_account_product_id: 99,
        },
      ],
    });

    const onChange = vi.fn();
    const formData: SimulationFormData = {
      accountId: "100001",
      initialBalance: "",
      startDate: "2026-03-01",
      endDate: "2026-03-10",
      transactions: [],
    };

    render(
      <SimulationForm
        formData={formData}
        onChange={onChange}
        onSubmit={vi.fn()}
        isLoading={false}
      />
    );

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          initialBalance: "2500.50",
        })
      );
    });
  });

  it("falls back to account balance when initial balance is empty", async () => {
    fetchAccountsMock.mockResolvedValue({
      success: true,
      data: [
        {
          id: 1,
          account_number: "100001",
          current_balance: "1500",
          virtual_account_product_id: 99,
        },
      ],
    });

    const onSubmit = vi.fn();
    const formData: SimulationFormData = {
      accountId: "100001",
      initialBalance: "",
      startDate: "2026-03-01",
      endDate: "2026-03-10",
      transactions: [],
    };

    render(
      <SimulationForm
        formData={formData}
        onChange={vi.fn()}
        onSubmit={onSubmit}
        isLoading={false}
      />
    );

    await waitFor(() => expect(fetchAccountsMock).toHaveBeenCalled());

    const user = userEvent.setup();
    const submitButton = screen.getByRole("button", { name: /run simulation/i });
    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith(1500);
  });
});

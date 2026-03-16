import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import HomePage from "@/app/page";

const { replaceMock, tokenStore } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  tokenStore: { value: null as string | null },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock("@/lib/auth", () => ({
  getAccessToken: () => tokenStore.value,
  clearAccessToken: () => {
    tokenStore.value = null;
  },
}));

vi.mock("@/hooks/useSimulation", () => ({
  useSimulation: () => ({
    formData: {
      accountNumber: "ACC-001",
      initialBalance: "1000",
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      annualRate: "5",
      transactions: [],
      qaToken: "",
    },
    setFormData: vi.fn(),
    result: null,
    isLoading: false,
    error: null,
    submitSimulation: vi.fn(),
    resetSimulation: vi.fn(),
  }),
}));

vi.mock("@/components/SimulationForm", () => ({
  default: () => <div>SimulationForm</div>,
}));

vi.mock("@/components/ResultsDisplay", () => ({
  default: () => <div>ResultsDisplay</div>,
}));

describe("Home auth redirect", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    tokenStore.value = null;
  });

  it("redirects unauthenticated users to /login", async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/login");
    });
  });

  it("does not redirect authenticated users", async () => {
    tokenStore.value = "access-token";

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
    });

    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("clears auth and redirects on sign out", async () => {
    tokenStore.value = "access-token";

    const user = userEvent.setup();

    render(<HomePage />);

    const signOutButton = await screen.findByRole("button", { name: /sign out/i });
    await user.click(signOutButton);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/login");
    });

    expect(tokenStore.value).toBeNull();
  });
});

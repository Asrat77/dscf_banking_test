import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import HomePage from "@/app/page";

const { replaceMock, getAccessTokenMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  getAccessTokenMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock("@/lib/auth", () => ({
  getAccessToken: getAccessTokenMock,
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
    getAccessTokenMock.mockReset();
  });

  it("redirects unauthenticated users to /login", async () => {
    getAccessTokenMock.mockReturnValue(null);

    render(<HomePage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/login");
    });
  });

  it("does not redirect authenticated users", async () => {
    getAccessTokenMock.mockReturnValue("access-token");

    render(<HomePage />);

    await waitFor(() => {
      expect(getAccessTokenMock).toHaveBeenCalled();
    });

    expect(replaceMock).not.toHaveBeenCalled();
  });
});

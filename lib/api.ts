export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface SimulationRequest {
  account_number: string;
  initial_balance: number;
  start_date: string;
  end_date: string;
  transactions?: Array<{
    date: string;
    amount: number;
    type: "deposit" | "withdrawal";
  }>;
}

export interface DailyBreakdown {
  date: string;
  opening_balance: string;
  interest: string;
  closing_balance: string;
  rate_used: string;
  days: number;
}

export interface AccountingEntry {
  account: string;
  debit: string | null;
  credit: string | null;
  description: string;
}

export interface SimulationResult {
  gross_interest: string;
  tax_amount: string;
  net_interest: string;
  daily_breakdown: DailyBreakdown[];
  accounting_records: AccountingEntry[];
}

const API_BASE_URL = "/api";
const BANKING_API_BASE = `${API_BASE_URL}/banking`;
const CORE_API_BASE = `${API_BASE_URL}/core`;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

type TokenGetter = () => string | null | undefined;

let authTokenGetter: TokenGetter | null = null;

export function setAuthTokenGetter(getter: TokenGetter | null): void {
  authTokenGetter = getter;
}

function getAuthToken(): string | null {
  if (authTokenGetter) {
    return authTokenGetter() || null;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    return localStorage.getItem("token") || localStorage.getItem("access_token");
  } catch {
    return null;
  }
}

function buildHeaders(headers: HeadersInit = {}): HeadersInit {
  const token = getAuthToken();

  if (!token) {
    return headers;
  }

  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
}

function buildBankingUrl(path: string): string {
  return `${BANKING_API_BASE}${path}`;
}

export function buildCoreUrl(path: string): string {
  return `${CORE_API_BASE}${path}`;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok && retries > 0 && response.status >= 500) {
      await sleep(RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      await sleep(RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export async function runSimulation(
  request: SimulationRequest
): Promise<ApiResponse<SimulationResult>> {
  try {
    const url = buildBankingUrl(`/accounts/${request.account_number}/interest_simulations`);
    
    const response = await fetchWithRetry(url, {
      method: "POST",
      headers: buildHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        initial_balance: request.initial_balance,
        start_date: request.start_date,
        end_date: request.end_date,
        transactions: request.transactions || [],
      }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: "Account not found. Please check the account ID and try again.",
        };
      }
      
      if (response.status === 422) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || "Invalid request. Please check your input and try again.",
          details: errorData,
        };
      }
      
      return {
        success: false,
        error: `Server error (${response.status}). Please try again later.`,
      };
    }

    const data = await response.json();
    
    if (data.success === false) {
      return {
        success: false,
        error: data.error || "Simulation failed",
        details: data,
      };
    }

    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    console.error("API Error:", error);
    return {
      success: false,
      error: "Network error. Please check your connection and try again.",
      details: error,
    };
  }
}

export interface Account {
  id: number;
  account_number: string;
  customer_name: string;
  account_type: string;
  status: string;
}

export async function fetchAccounts(): Promise<ApiResponse<Account[]>> {
  try {
    const url = buildBankingUrl("/accounts");
    
    const response = await fetchWithRetry(url, {
      method: "GET",
      headers: buildHeaders({
        "Content-Type": "application/json",
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch accounts (${response.status})`,
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    console.error("API Error:", error);
    return {
      success: false,
      error: "Failed to load accounts. Please try again.",
      details: error,
    };
  }
}

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

type RawDailyBreakdown = Record<string, unknown>;
type RawAccountingEntry = Record<string, unknown>;

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toMoneyString(value: unknown): string {
  return toNumber(value).toFixed(2);
}

function normalizeDailyBreakdown(rawDailyBreakdown: unknown): DailyBreakdown[] {
  if (!Array.isArray(rawDailyBreakdown)) {
    return [];
  }

  let previousClosing = 0;

  return rawDailyBreakdown.map((item) => {
    const row = item as RawDailyBreakdown;
    const balance = toNumber(row.balance);
    const dailyInterest = toNumber(
      row.interest ?? row.daily_interest ?? row.daily_interest_accrued,
    );
    const transactionTotal = toNumber(row.transaction_total);

    const explicitOpening =
      row.opening_balance ?? row.beginning_balance ?? row.opening;
    const explicitClosing =
      row.closing_balance ?? row.ending_balance ?? row.closing;

    const openingBalance =
      explicitOpening !== undefined
        ? toNumber(explicitOpening)
        : previousClosing || balance - transactionTotal;
    const closingBalance =
      explicitClosing !== undefined
        ? toNumber(explicitClosing)
        : balance + dailyInterest;

    previousClosing = closingBalance;

    return {
      date: String(row.date || ""),
      opening_balance: toMoneyString(openingBalance),
      interest: toMoneyString(dailyInterest),
      closing_balance: toMoneyString(closingBalance),
      rate_used: String(row.rate_used ?? row.rate ?? "-"),
      days: Math.max(1, Math.trunc(toNumber(row.days) || 1)),
    };
  });
}

function normalizeAccountingRecords(rawRecords: unknown): AccountingEntry[] {
  if (!Array.isArray(rawRecords)) {
    return [];
  }

  return rawRecords.map((item) => {
    const row = item as RawAccountingEntry;

    if (row.account || row.debit || row.credit || row.description) {
      return {
        account: String(row.account || "-"),
        debit: row.debit != null ? toMoneyString(row.debit) : null,
        credit: row.credit != null ? toMoneyString(row.credit) : null,
        description: String(row.description || "-"),
      };
    }

    const type = String(row.type || "entry");
    const amount = toMoneyString(row.amount);
    const currency = String(row.currency || "ETB");
    const date = row.date ? String(row.date) : "";

    return {
      account: type
        .replaceAll("_", " ")
        .replace(/\b\w/g, (m) => m.toUpperCase()),
      debit: type === "tax" ? amount : null,
      credit: type === "tax" ? null : amount,
      description:
        [currency, date].filter(Boolean).join(" • ") || "Simulation entry",
    };
  });
}

function normalizeSimulationResult(raw: unknown): SimulationResult {
  const payload = (raw || {}) as Record<string, unknown>;

  const grossInterest = payload.gross_interest ?? payload.total_interest ?? 0;
  const taxAmount = payload.tax_amount ?? 0;
  const netInterest =
    payload.net_interest ?? toNumber(grossInterest) - toNumber(taxAmount);

  return {
    gross_interest: toMoneyString(grossInterest),
    tax_amount: toMoneyString(taxAmount),
    net_interest: toMoneyString(netInterest),
    daily_breakdown: normalizeDailyBreakdown(payload.daily_breakdown),
    accounting_records: normalizeAccountingRecords(payload.accounting_records),
  };
}

function extract422ErrorMessage(errorData: Record<string, unknown>): string {
  if (typeof errorData.error === "string" && errorData.error.trim()) {
    return errorData.error;
  }

  if (Array.isArray(errorData.errors)) {
    const messages = errorData.errors
      .map((entry) => (typeof entry === "string" ? entry : ""))
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join("; ");
    }
  }

  if (errorData.errors && typeof errorData.errors === "object") {
    const fieldMessages = Object.entries(
      errorData.errors as Record<string, unknown>,
    ).flatMap(([field, value]) => {
      if (Array.isArray(value)) {
        return value
          .map((message) =>
            typeof message === "string" ? `${field}: ${message}` : "",
          )
          .filter(Boolean);
      }

      if (typeof value === "string") {
        return [`${field}: ${value}`];
      }

      return [];
    });

    if (fieldMessages.length > 0) {
      return fieldMessages.join("; ");
    }
  }

  return "Invalid request. Please check your input and try again.";
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(
  /\/+$/,
  "",
);

function scopedApiBase(scope: "banking" | "core"): string {
  if (API_BASE_URL.endsWith(`/${scope}`)) {
    return API_BASE_URL;
  }

  if (API_BASE_URL.endsWith("/banking") || API_BASE_URL.endsWith("/core")) {
    return API_BASE_URL.replace(/\/(banking|core)$/, `/${scope}`);
  }

  return `${API_BASE_URL}/${scope}`;
}

const BANKING_API_BASE = scopedApiBase("banking");
const CORE_API_BASE = scopedApiBase("core");
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

type TokenGetter = () => string | null | undefined;

let authTokenGetter: TokenGetter | null = null;

export function setAuthTokenGetter(getter: TokenGetter | null): void {
  authTokenGetter = getter;
}

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const key = `${encodeURIComponent(name)}=`;
  const parts = document.cookie.split(";");

  for (const part of parts) {
    const cookie = part.trim();
    if (cookie.startsWith(key)) {
      return decodeURIComponent(cookie.slice(key.length));
    }
  }

  return null;
}

function getAuthToken(): string | null {
  if (authTokenGetter) {
    return authTokenGetter() || null;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const localToken =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("access_token");

    if (localToken) {
      return localToken;
    }

    return (
      getCookieValue("accessToken") ||
      getCookieValue("token") ||
      getCookieValue("access_token")
    );
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

export interface LoginRequest {
  email_or_phone: string;
  password: string;
}

export interface LoginData {
  access_token: string;
}

function extractLoginToken(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = payload as Record<string, unknown>;
  const nested =
    data.data && typeof data.data === "object"
      ? (data.data as Record<string, unknown>)
      : null;

  const directToken =
    typeof data.access_token === "string"
      ? data.access_token
      : typeof data.token === "string"
        ? data.token
        : null;

  if (directToken) {
    return directToken;
  }

  if (!nested) {
    return null;
  }

  if (typeof nested.access_token === "string") {
    return nested.access_token;
  }

  if (typeof nested.token === "string") {
    return nested.token;
  }

  return null;
}

export async function loginWithCoreAuth(
  credentials: LoginRequest,
): Promise<ApiResponse<LoginData>> {
  try {
    const response = await fetch(buildCoreUrl("/auth/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_or_phone: credentials.email_or_phone,
        password: credentials.password,
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorData = payload as Record<string, unknown>;
      const errorMessage =
        (typeof errorData.error === "string" && errorData.error) ||
        (typeof errorData.message === "string" && errorData.message) ||
        "Login failed. Please check your credentials and try again.";

      return {
        success: false,
        error: errorMessage,
        details: payload,
      };
    }

    const token = extractLoginToken(payload);

    if (!token) {
      return {
        success: false,
        error: "Login succeeded but no access token was returned.",
        details: payload,
      };
    }

    return {
      success: true,
      data: {
        access_token: token,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Network error. Please check your connection and try again.",
      details: error,
    };
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES,
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
  request: SimulationRequest,
): Promise<ApiResponse<SimulationResult>> {
  try {
    const url = buildBankingUrl(
      `/accounts/${request.account_number}/interest_simulations`,
    );

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
          error:
            "Account not found. Please check the account ID and try again.",
        };
      }

      if (response.status === 422) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: extract422ErrorMessage(errorData),
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
      data: normalizeSimulationResult(data.data || data),
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
  customer_name?: string;
  name?: string;
  account_type?: string;
  status?: string;
  current_balance?: number | string;
  virtual_account_product?: {
    id: number;
    product_code?: string;
    product_name?: string;
  };
  virtual_account_product_id?: number;
}

export interface InterestRateType {
  id: number;
  code?: string;
  name?: string;
  description?: string;
}

export interface VirtualAccountProduct {
  id: number;
  product_code?: string;
  product_name?: string;
}

export interface InterestConfiguration {
  id: number;
  virtual_account_product_id: number;
  interest_rate_type_id: number;
  annual_interest_rate: number | string | null;
  income_tax_rate: number | string | null;
  minimum_balance_for_interest: number | string | null;
  calculation_method?: string | null;
  compounding_period?: string | null;
  interest_basis?: string | null;
  accrual_frequency?: string | null;
  rounding_rule?: string | null;
  calculation_timing?: string | null;
  promotional_start_date?: string | null;
  promotional_end_date?: string | null;
  is_active?: boolean;
  interest_rate_type?: InterestRateType;
  virtual_account_product?: VirtualAccountProduct;
}

export interface InterestRateTier {
  id: number;
  interest_config_id?: number;
  tier_order: number;
  balance_min: number | string;
  balance_max?: number | string | null;
  interest_rate: number | string;
  description?: string | null;
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
      if (response.status === 401) {
        return {
          success: false,
          error: "Unauthorized (401). Please sign in again to load accounts.",
        };
      }

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

export async function fetchInterestConfigurations(
  productId: number,
): Promise<ApiResponse<InterestConfiguration[]>> {
  try {
    const params = new URLSearchParams({
      include: "interest_rate_type,virtual_account_product",
    });
    const url = buildBankingUrl(
      `/interest_configurations?${params.toString()}`,
    );

    const response = await fetchWithRetry(url, {
      method: "GET",
      headers: buildHeaders({
        "Content-Type": "application/json",
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error:
            "Unauthorized (401). Please sign in again to load interest configurations.",
        };
      }

      return {
        success: false,
        error: `Failed to fetch interest configurations (${response.status})`,
      };
    }

    const data = await response.json();
    const payload = data.data || data;
    const filtered = Array.isArray(payload)
      ? payload.filter((config: InterestConfiguration) => {
          const matchesProduct =
            String(config.virtual_account_product_id) === String(productId);
          return matchesProduct && config.is_active;
        })
      : [];

    return {
      success: true,
      data: filtered,
    };
  } catch (error) {
    console.error("API Error:", error);
    return {
      success: false,
      error: "Failed to load interest configurations. Please try again.",
      details: error,
    };
  }
}

export async function fetchInterestRateTiers(
  configId: number,
): Promise<ApiResponse<InterestRateTier[]>> {
  try {
    const url = buildBankingUrl("/interest_rate_tiers");

    const response = await fetchWithRetry(url, {
      method: "GET",
      headers: buildHeaders({
        "Content-Type": "application/json",
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error:
            "Unauthorized (401). Please sign in again to load interest tiers.",
        };
      }

      return {
        success: false,
        error: `Failed to fetch interest tiers (${response.status})`,
      };
    }

    const data = await response.json();
    const payload = data.data || data;
    const filtered = Array.isArray(payload)
      ? payload
          .filter(
            (tier: InterestRateTier) =>
              String(tier.interest_config_id) === String(configId),
          )
          .sort(
            (a: InterestRateTier, b: InterestRateTier) =>
              a.tier_order - b.tier_order,
          )
      : [];

    return {
      success: true,
      data: filtered,
    };
  } catch (error) {
    console.error("API Error:", error);
    return {
      success: false,
      error: "Failed to load interest tiers. Please try again.",
      details: error,
    };
  }
}

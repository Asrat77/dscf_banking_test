const ACCESS_TOKEN_KEY = "accessToken";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveAccessToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

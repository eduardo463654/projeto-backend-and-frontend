const defaultBaseUrl = "http://localhost:3333";
const ACCESS_TOKEN_KEY = "lab_access_token";
const REFRESH_TOKEN_KEY = "lab_refresh_token";
const USER_KEY = "lab_user";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  user: Record<string, unknown> & { role: string };
};

class SessionExpiredError extends Error {}

let refreshInFlight: Promise<string> | null = null;

export type ApiError = {
  statusCode: number;
  message: string;
  error?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? defaultBaseUrl;

export function setAuthSession(
  accessToken: string,
  refreshToken: string,
  user: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  if (typeof user.role === "string") {
    document.cookie = `lab_session=${encodeURIComponent(user.role)}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax`;
  }
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = "lab_session=; path=/; max-age=0; SameSite=Lax";
}

export function getStoredAccessToken() {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

function getStoredRefreshToken() {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

async function renewAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = getStoredRefreshToken();
      if (!refreshToken)
        throw new SessionExpiredError("Refresh token ausente.");

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.status === 401) {
        throw new SessionExpiredError("Refresh token expirado.");
      }

      const payload = (await response.json()) as TokenResponse | ApiError;
      if (!response.ok) {
        throw new Error(
          (payload as ApiError).message ?? "Não foi possível renovar a sessão.",
        );
      }

      const session = payload as TokenResponse;
      setAuthSession(session.access_token, session.refresh_token, session.user);
      return session.access_token;
    })().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const send = (token: string | null) => {
    const headers = new Headers(init.headers ?? {});
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    return fetch(`${API_BASE_URL}${path}`, {
      credentials: "include",
      ...init,
      headers,
    });
  };

  let response = await send(getStoredAccessToken());

  if (response.status === 401 && !path.startsWith("/auth/")) {
    try {
      response = await send(await renewAccessToken());
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        clearAuthSession();
        if (
          typeof window !== "undefined" &&
          !["/login", "/cadastro"].includes(window.location.pathname)
        ) {
          window.location.assign("/login");
        }
        throw new Error("Sua sessão expirou. Entre novamente para continuar.");
      }
      throw error;
    }
  }

  const isJsonResponse = response.headers
    .get("content-type")
    ?.includes("application/json");
  const payload = isJsonResponse ? await response.json() : null;

  if (!response.ok) {
    const error = payload as ApiError;
    throw new Error(error?.message ?? "Erro ao comunicar com a API.");
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, init?: RequestInit) =>
    request<T>(path, { ...init, cache: "no-store", method: "GET" }),
  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  del: <T>(path: string, init?: RequestInit) =>
    request<T>(path, { ...init, method: "DELETE" }),
};

import { clearSessionTokens, getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from "../auth/token-store";
import { getBackendApiBaseUrl } from "./base-url";

let refreshInFlight: Promise<boolean> | null = null;

type RefreshTokens = {
  accessToken: string;
  refreshToken: string;
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.length > 0;
};

const parseRefreshTokens = (payload: unknown): RefreshTokens | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const body = payload as { access_token?: unknown; refresh_token?: unknown };

  if (!isNonEmptyString(body.access_token) || !isNonEmptyString(body.refresh_token)) {
    return null;
  }

  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
  };
};

const withAuthorization = (init: RequestInit | undefined, accessToken: string | null): RequestInit => {
  const headers = new Headers(init?.headers);

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return {
    ...init,
    headers,
  };
};

const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  const failRefresh = () => {
    clearSessionTokens();
    return false;
  };

  if (!refreshToken) {
    return false;
  }

  if (!refreshInFlight) {
    refreshInFlight = fetch(`${getBackendApiBaseUrl()}/api/v1/session/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) {
          return failRefresh();
        }

        const tokens = parseRefreshTokens(await response.json());

        if (!tokens) {
          return failRefresh();
        }

        setAccessToken(tokens.accessToken);
        setRefreshToken(tokens.refreshToken);
        return true;
      })
      .catch(() => {
        return failRefresh();
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
};

const getAccessTokenForRequest = async (): Promise<string | null> => {
  const accessToken = getAccessToken();

  if (accessToken || !getRefreshToken()) {
    return accessToken;
  }

  await refreshAccessToken();
  return getAccessToken();
};

export const authorizedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const accessToken = await getAccessTokenForRequest();

  const initialResponse = await fetch(input, withAuthorization(init, accessToken));

  if (initialResponse.status !== 401 || !getRefreshToken()) {
    return initialResponse;
  }

  const refreshed = await refreshAccessToken();

  if (!refreshed) {
    return initialResponse;
  }

  return fetch(input, withAuthorization(init, getAccessToken()));
};

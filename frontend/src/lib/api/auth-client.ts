import { clearSessionTokens, getAccessToken, getRefreshToken, setAccessToken } from "../auth/token-store";
import { getBackendApiBaseUrl } from "./base-url";

let refreshInFlight: Promise<boolean> | null = null;

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

        const body = (await response.json()) as { access_token?: string };

        if (!body.access_token) {
          return failRefresh();
        }

        setAccessToken(body.access_token);
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

export const authorizedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const initialResponse = await fetch(input, withAuthorization(init, getAccessToken()));

  if (initialResponse.status !== 401 || !getRefreshToken()) {
    return initialResponse;
  }

  const refreshed = await refreshAccessToken();

  if (!refreshed) {
    return initialResponse;
  }

  return fetch(input, withAuthorization(init, getAccessToken()));
};

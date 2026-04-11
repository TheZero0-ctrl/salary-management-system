import { getBackendApiBaseUrl } from "./base-url";

export const createSession = (email: string, password: string) =>
  fetch(`${getBackendApiBaseUrl()}/api/v1/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

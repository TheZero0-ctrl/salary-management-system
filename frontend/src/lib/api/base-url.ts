const DEFAULT_BACKEND_API_BASE_URL = "http://127.0.0.1:3000";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const getBackendApiBaseUrl = () => {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL?.trim();

  if (!configuredBaseUrl) {
    return DEFAULT_BACKEND_API_BASE_URL;
  }

  return trimTrailingSlash(configuredBaseUrl);
};

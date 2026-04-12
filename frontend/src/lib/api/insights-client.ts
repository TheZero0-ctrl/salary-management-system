import { authorizedFetch } from "./auth-client";
import { getBackendApiBaseUrl } from "./base-url";
import { extractRequestId, presentApiError } from "./error-presenter";

type ApiErrorResponse = {
  error?: {
    message?: string;
    details?: Array<{ field?: string; message?: string }>;
  };
};

type CountriesApiResponse = {
  data?: {
    min?: number | null;
    max?: number | null;
    avg?: number | null;
    median?: number | null;
    stddev?: number | null;
    count?: number;
    computed_at?: string;
  };
};

type SegmentsApiResponse = {
  data?: {
    min?: number | null;
    max?: number | null;
    avg?: number | null;
    median?: number | null;
    p25?: number | null;
    p75?: number | null;
    p90?: number | null;
    count?: number;
    computed_at?: string;
  };
};

type DistributionsApiResponse = {
  data?: {
    bucket_size?: number;
    buckets?: Array<{
      min_salary?: number;
      max_salary?: number;
      count?: number;
    }>;
    top_countries?: Array<{
      country_code?: string;
      avg_salary?: number;
    }>;
    bottom_countries?: Array<{
      country_code?: string;
      avg_salary?: number;
    }>;
    computed_at?: string;
  };
};

export type InsightsFieldErrors = {
  countryCode?: string;
  jobTitle?: string;
  bucketSize?: string;
};

export type CountryMetrics = {
  min: number | null;
  max: number | null;
  avg: number | null;
  median: number | null;
  stddev: number | null;
  count: number;
  computedAt: string | null;
};

export type SegmentMetrics = {
  min: number | null;
  max: number | null;
  avg: number | null;
  median: number | null;
  p25: number | null;
  p75: number | null;
  p90: number | null;
  count: number;
  computedAt: string | null;
};

export type DistributionBucket = {
  minSalary: number;
  maxSalary: number;
  count: number;
};

export type CountrySalaryBand = {
  countryCode: string;
  averageSalary: number;
};

export type DistributionMetrics = {
  bucketSize: number;
  buckets: DistributionBucket[];
  topCountries: CountrySalaryBand[];
  bottomCountries: CountrySalaryBand[];
  computedAt: string | null;
};

type InsightsSuccessResult<TData> = {
  kind: "success";
  data: TData;
};

type InsightsValidationErrorResult = {
  kind: "validation-error";
  fieldErrors: InsightsFieldErrors;
};

type InsightsErrorResult = {
  kind: "error";
  message: string;
};

export type CountryMetricsResult =
  | InsightsSuccessResult<CountryMetrics>
  | InsightsValidationErrorResult
  | InsightsErrorResult;

export type SegmentMetricsResult =
  | InsightsSuccessResult<SegmentMetrics>
  | InsightsValidationErrorResult
  | InsightsErrorResult;

export type DistributionMetricsResult =
  | InsightsSuccessResult<DistributionMetrics>
  | InsightsValidationErrorResult
  | InsightsErrorResult;

const readErrorBody = async (response: Response): Promise<ApiErrorResponse | null> => {
  try {
    return (await response.json()) as ApiErrorResponse;
  } catch {
    return null;
  }
};

const parseValidationOrError = async (response: Response): Promise<InsightsValidationErrorResult | InsightsErrorResult> => {
  const body = await readErrorBody(response);
  const presentedError = presentApiError({ status: response.status, body });

  if (presentedError.kind === "validation-error") {
    return {
      kind: "validation-error",
      fieldErrors: presentedError.fieldErrors,
    };
  }

  const requestId = extractRequestId(response.headers);
  const baseMessage = body?.error?.message ?? "Unable to load insights";

  return {
    kind: "error",
    message: requestId ? `${baseMessage} (request id: ${requestId})` : baseMessage,
  };
};

const readJson = async <T>(response: Response): Promise<T | null> => {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const toCountryMetrics = (body: CountriesApiResponse | null): CountryMetrics | null => {
  const data = body?.data;

  if (!data) {
    return null;
  }

  return {
    min: data.min ?? null,
    max: data.max ?? null,
    avg: data.avg ?? null,
    median: data.median ?? null,
    stddev: data.stddev ?? null,
    count: data.count ?? 0,
    computedAt: data.computed_at ?? null,
  };
};

const toSegmentMetrics = (body: SegmentsApiResponse | null): SegmentMetrics | null => {
  const data = body?.data;

  if (!data) {
    return null;
  }

  return {
    min: data.min ?? null,
    max: data.max ?? null,
    avg: data.avg ?? null,
    median: data.median ?? null,
    p25: data.p25 ?? null,
    p75: data.p75 ?? null,
    p90: data.p90 ?? null,
    count: data.count ?? 0,
    computedAt: data.computed_at ?? null,
  };
};

const toDistributionMetrics = (body: DistributionsApiResponse | null): DistributionMetrics | null => {
  const data = body?.data;

  if (!data) {
    return null;
  }

  return {
    bucketSize: data.bucket_size ?? 0,
    buckets: (data.buckets ?? []).map((bucket) => ({
      minSalary: bucket.min_salary ?? 0,
      maxSalary: bucket.max_salary ?? 0,
      count: bucket.count ?? 0,
    })),
    topCountries: (data.top_countries ?? []).map((country) => ({
      countryCode: country.country_code ?? "--",
      averageSalary: country.avg_salary ?? 0,
    })),
    bottomCountries: (data.bottom_countries ?? []).map((country) => ({
      countryCode: country.country_code ?? "--",
      averageSalary: country.avg_salary ?? 0,
    })),
    computedAt: data.computed_at ?? null,
  };
};

const buildUrl = (path: string, params: URLSearchParams) => {
  const query = params.toString();
  return `${getBackendApiBaseUrl()}${path}${query ? `?${query}` : ""}`;
};

export const getCountryMetrics = async (countryCode: string): Promise<CountryMetricsResult> => {
  const params = new URLSearchParams({ country_code: countryCode });
  const response = await authorizedFetch(buildUrl("/api/v1/insights/countries", params));

  if (!response.ok) {
    return parseValidationOrError(response);
  }

  const metrics = toCountryMetrics(await readJson<CountriesApiResponse>(response));

  if (!metrics) {
    return { kind: "error", message: "Unable to load insights" };
  }

  return { kind: "success", data: metrics };
};

export const getSegmentMetrics = async (
  countryCode: string,
  jobTitle: string,
): Promise<SegmentMetricsResult> => {
  const params = new URLSearchParams({ country_code: countryCode, job_title: jobTitle });
  const response = await authorizedFetch(buildUrl("/api/v1/insights/segments", params));

  if (!response.ok) {
    return parseValidationOrError(response);
  }

  const metrics = toSegmentMetrics(await readJson<SegmentsApiResponse>(response));

  if (!metrics) {
    return { kind: "error", message: "Unable to load insights" };
  }

  return { kind: "success", data: metrics };
};

type DistributionMetricsQuery = {
  countryCode?: string;
  jobTitle?: string;
  bucketSize?: number;
};

export const getDistributionMetrics = async (
  query: DistributionMetricsQuery,
): Promise<DistributionMetricsResult> => {
  const params = new URLSearchParams();

  if (query.countryCode) {
    params.set("country_code", query.countryCode);
  }

  if (query.jobTitle) {
    params.set("job_title", query.jobTitle);
  }

  if (query.bucketSize !== undefined) {
    params.set("bucket_size", String(query.bucketSize));
  }

  const response = await authorizedFetch(buildUrl("/api/v1/insights/distributions", params));

  if (!response.ok) {
    return parseValidationOrError(response);
  }

  const metrics = toDistributionMetrics(await readJson<DistributionsApiResponse>(response));

  if (!metrics) {
    return { kind: "error", message: "Unable to load insights" };
  }

  return { kind: "success", data: metrics };
};

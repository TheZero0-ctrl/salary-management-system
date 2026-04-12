import type { ListEmployeesQuery } from "../api/employees-client";

export type EmployeeFilterValues = {
  search: string;
  countryCode: string;
  jobTitle: string;
  department: string;
  status: string;
};

const EMPLOYEES_PATH = "/employees";
const SEARCH_PARAM_NAME = "search";
const COUNTRY_PARAM_NAME = "country_code";
const JOB_TITLE_PARAM_NAME = "job_title";
const DEPARTMENT_PARAM_NAME = "department";
const STATUS_PARAM_NAME = "status";
const PAGE_PARAM_NAME = "page";
const FILTER_PARAM_NAMES = [SEARCH_PARAM_NAME, COUNTRY_PARAM_NAME, JOB_TITLE_PARAM_NAME, DEPARTMENT_PARAM_NAME, STATUS_PARAM_NAME] as const;
const SEARCH_SUBMIT_RESET_PARAM_NAMES = [PAGE_PARAM_NAME] as const;
const CLEAR_FILTER_RESET_PARAM_NAMES = [...SEARCH_SUBMIT_RESET_PARAM_NAMES, ...FILTER_PARAM_NAMES] as const;

const parseNumberParam = (value: string | null) => {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const maybeStringParam = (value: string | null) => {
  if (!value) {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue === "" ? undefined : trimmedValue;
};

const removeQueryParams = (searchParams: URLSearchParams, paramNames: readonly string[]) => {
  paramNames.forEach((paramName) => {
    searchParams.delete(paramName);
  });
};

const setOrDeleteNormalizedStringParam = (searchParams: URLSearchParams, paramName: string, value: string) => {
  const normalizedValue = maybeStringParam(value);

  if (normalizedValue === undefined) {
    searchParams.delete(paramName);
    return;
  }

  searchParams.set(paramName, normalizedValue);
};

const toEmployeesUrl = (searchParams: URLSearchParams) => {
  const serializedSearchParams = searchParams.toString();
  return serializedSearchParams ? `${EMPLOYEES_PATH}?${serializedSearchParams}` : EMPLOYEES_PATH;
};

export const getEmployeeFilterValuesFromSearchParams = (
  searchParams: Pick<URLSearchParams, "get">,
): EmployeeFilterValues => ({
  search: searchParams.get(SEARCH_PARAM_NAME) ?? "",
  countryCode: searchParams.get(COUNTRY_PARAM_NAME) ?? "",
  jobTitle: searchParams.get(JOB_TITLE_PARAM_NAME) ?? "",
  department: searchParams.get(DEPARTMENT_PARAM_NAME) ?? "",
  status: searchParams.get(STATUS_PARAM_NAME) ?? "",
});

export const buildEmployeesQueryFromSearchParams = (
  searchParams: Pick<URLSearchParams, "get">,
): ListEmployeesQuery => {
  const query: ListEmployeesQuery = {};

  const search = maybeStringParam(searchParams.get("search"));
  const countryCode = maybeStringParam(searchParams.get("country_code"));
  const jobTitle = maybeStringParam(searchParams.get("job_title"));
  const department = maybeStringParam(searchParams.get("department"));
  const status = maybeStringParam(searchParams.get("status"));
  const salaryMin = parseNumberParam(searchParams.get("salary_min"));
  const salaryMax = parseNumberParam(searchParams.get("salary_max"));
  const sortBy = maybeStringParam(searchParams.get("sort_by"));
  const sortDirection = maybeStringParam(searchParams.get("sort_direction"));
  const page = parseNumberParam(searchParams.get("page"));
  const perPage = parseNumberParam(searchParams.get("per_page"));

  if (search !== undefined) query.search = search;
  if (countryCode !== undefined) query.countryCode = countryCode;
  if (jobTitle !== undefined) query.jobTitle = jobTitle;
  if (department !== undefined) query.department = department;
  if (status !== undefined) query.status = status;
  if (salaryMin !== undefined) query.salaryMin = salaryMin;
  if (salaryMax !== undefined) query.salaryMax = salaryMax;
  if (sortBy !== undefined) query.sortBy = sortBy;
  if (sortDirection !== undefined) query.sortDirection = sortDirection;
  if (page !== undefined) query.page = page;
  if (perPage !== undefined) query.perPage = perPage;

  return query;
};

export const buildEmployeesSearchUrl = (currentSearchParams: string, filterValues: EmployeeFilterValues) => {
  const nextSearchParams = new URLSearchParams(currentSearchParams);

  removeQueryParams(nextSearchParams, SEARCH_SUBMIT_RESET_PARAM_NAMES);
  setOrDeleteNormalizedStringParam(nextSearchParams, SEARCH_PARAM_NAME, filterValues.search);
  setOrDeleteNormalizedStringParam(nextSearchParams, COUNTRY_PARAM_NAME, filterValues.countryCode);
  setOrDeleteNormalizedStringParam(nextSearchParams, JOB_TITLE_PARAM_NAME, filterValues.jobTitle);
  setOrDeleteNormalizedStringParam(nextSearchParams, DEPARTMENT_PARAM_NAME, filterValues.department);
  setOrDeleteNormalizedStringParam(nextSearchParams, STATUS_PARAM_NAME, filterValues.status);

  return toEmployeesUrl(nextSearchParams);
};

export const buildEmployeesClearFiltersUrl = (currentSearchParams: string) => {
  const nextSearchParams = new URLSearchParams(currentSearchParams);
  removeQueryParams(nextSearchParams, CLEAR_FILTER_RESET_PARAM_NAMES);

  return toEmployeesUrl(nextSearchParams);
};

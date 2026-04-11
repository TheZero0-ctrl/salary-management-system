import { authorizedFetch } from "./auth-client";
import { getBackendApiBaseUrl } from "./base-url";

export type EmployeeListItem = {
  id?: number;
  fullName: string;
  employeeCode: string;
  jobTitle?: string;
  country?: string;
  department?: string;
  employmentType?: string;
  salary?: string | number;
  status?: string;
  effectiveFrom?: string;
  hireDate?: string;
  lastSalaryReviewDate?: string;
};

type EmployeeApiItem = {
  id?: number;
  full_name: string;
  employee_code: string;
  job_title?: string | null;
  country_code?: string | null;
  department?: string | null;
  employment_type?: string | null;
  salary?: number | null;
  status?: string | null;
  effective_from?: string | null;
  hire_date?: string | null;
  last_salary_review_date?: string | null;
};

type EmployeesIndexResponse = {
  data?: EmployeeApiItem[];
  meta?: {
    page?: number;
    per_page?: number;
    total_count?: number;
    total_pages?: number;
  };
};

type EmployeeDetailResponse = {
  data?: EmployeeApiItem;
};

export type GetEmployeeByCodeResult =
  | { kind: "found"; employee: EmployeeListItem }
  | { kind: "not-found" }
  | { kind: "error" };

const getEmployeeByCodeFailureResult = (statusCode: number): GetEmployeeByCodeResult => {
  if (statusCode === 404) {
    return { kind: "not-found" };
  }

  return { kind: "error" };
};

export type ListEmployeesQuery = {
  search?: string | null;
  countryCode?: string | null;
  department?: string | null;
  status?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  sortBy?: string | null;
  sortDirection?: string | null;
  page?: number | null;
  perPage?: number | null;
};

export type EmployeesPaginationMeta = {
  page: number;
  perPage: number;
  totalCount: number;
  totalPages: number;
};

export type ListEmployeesResult = {
  data: EmployeeListItem[];
  meta?: EmployeesPaginationMeta;
};

const LIST_EMPLOYEES_QUERY_PARAM_MAPPINGS: ReadonlyArray<readonly [string, keyof ListEmployeesQuery]> = [
  ["search", "search"],
  ["country_code", "countryCode"],
  ["department", "department"],
  ["status", "status"],
  ["salary_min", "salaryMin"],
  ["salary_max", "salaryMax"],
  ["sort_by", "sortBy"],
  ["sort_direction", "sortDirection"],
  ["page", "page"],
  ["per_page", "perPage"],
];

const toEmployeeListItem = (employee: EmployeeApiItem): EmployeeListItem => ({
  id: employee.id,
  fullName: employee.full_name,
  employeeCode: employee.employee_code,
  jobTitle: employee.job_title ?? undefined,
  country: employee.country_code ?? undefined,
  department: employee.department ?? undefined,
  employmentType: employee.employment_type ?? undefined,
  salary: employee.salary ?? undefined,
  status: employee.status ?? undefined,
  effectiveFrom: employee.effective_from ?? undefined,
  hireDate: employee.hire_date ?? undefined,
  lastSalaryReviewDate: employee.last_salary_review_date ?? undefined,
});

export const listEmployees = async (query?: ListEmployeesQuery): Promise<ListEmployeesResult> => {
  const params = new URLSearchParams();

  const maybeAdd = (key: string, value: string | number | null | undefined) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    params.set(key, String(value));
  };

  for (const [paramKey, queryKey] of LIST_EMPLOYEES_QUERY_PARAM_MAPPINGS) {
    maybeAdd(paramKey, query?.[queryKey]);
  }

  const queryString = params.toString();
  const url = `${getBackendApiBaseUrl()}/api/v1/employees${queryString ? `?${queryString}` : ""}`;

  const response = await authorizedFetch(url);

  if (!response.ok) {
    return { data: [] };
  }

  const body = (await response.json()) as EmployeesIndexResponse;

  const meta = body.meta
    ? {
        page: body.meta.page ?? 1,
        perPage: body.meta.per_page ?? 12,
        totalCount: body.meta.total_count ?? 0,
        totalPages: body.meta.total_pages ?? 1,
      }
    : undefined;

  return {
    data: (body.data ?? []).map(toEmployeeListItem),
    meta,
  };
};

export const getEmployeeByCode = async (
  employeeCode: string,
): Promise<GetEmployeeByCodeResult> => {
  const url = `${getBackendApiBaseUrl()}/api/v1/employees/${employeeCode}`;
  const response = await authorizedFetch(url);

  if (!response.ok) {
    return getEmployeeByCodeFailureResult(response.status);
  }

  const body = (await response.json()) as EmployeeDetailResponse;
  const employee = body.data;

  if (!employee) {
    return { kind: "not-found" };
  }

  return {
    kind: "found",
    employee: toEmployeeListItem(employee),
  };
};

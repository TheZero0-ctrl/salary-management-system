import { authorizedFetch } from "./auth-client";
import { getBackendApiBaseUrl } from "./base-url";

export type EmployeeListItem = {
  fullName: string;
  employeeCode: string;
  jobTitle?: string;
  country?: string;
  department?: string;
  employmentType?: string;
  salary?: string | number;
  status?: string;
  effectiveFrom?: string;
};

type EmployeeApiItem = {
  full_name: string;
  employee_code: string;
  job_title?: string | null;
  country_code?: string | null;
  department?: string | null;
  employment_type?: string | null;
  salary?: number | null;
  status?: string | null;
  effective_from?: string | null;
};

type EmployeesIndexResponse = {
  data?: EmployeeApiItem[];
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

export const listEmployees = async (query?: ListEmployeesQuery): Promise<EmployeeListItem[]> => {
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
    return [];
  }

  const body = (await response.json()) as EmployeesIndexResponse;

  return (body.data ?? []).map((employee) => ({
    fullName: employee.full_name,
    employeeCode: employee.employee_code,
    jobTitle: employee.job_title ?? undefined,
    country: employee.country_code ?? undefined,
    department: employee.department ?? undefined,
    employmentType: employee.employment_type ?? undefined,
    salary: employee.salary ?? undefined,
    status: employee.status ?? undefined,
    effectiveFrom: employee.effective_from ?? undefined,
  }));
};

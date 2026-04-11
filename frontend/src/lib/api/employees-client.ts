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

export const listEmployees = async (): Promise<EmployeeListItem[]> => {
  const response = await authorizedFetch(`${getBackendApiBaseUrl()}/api/v1/employees`);

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

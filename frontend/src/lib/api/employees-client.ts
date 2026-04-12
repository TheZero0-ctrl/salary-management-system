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

type EmployeeMutationApiError = {
  field?: string;
  message?: string;
  code?: string;
};

type EmployeeMutationErrorResponse = {
  errors?: EmployeeMutationApiError[];
  details?: EmployeeMutationApiError[];
};

export type GetEmployeeByCodeResult =
  | { kind: "found"; employee: EmployeeListItem }
  | { kind: "not-found" }
  | { kind: "error" };

export type EmployeeMutationPayload = {
  fullName?: string;
  employeeCode?: string;
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

export type CreateEmployeeResult =
  | { kind: "created"; employeeCode: string }
  | { kind: "validation-error"; fieldErrors: Record<string, string> }
  | { kind: "duplicate-employee-code"; message: string }
  | { kind: "error" };

export type UpdateEmployeeResult =
  | { kind: "updated" }
  | { kind: "validation-error"; fieldErrors: Record<string, string> }
  | { kind: "duplicate-employee-code"; message: string }
  | { kind: "not-found" }
  | { kind: "error" };

export type DeleteEmployeeResult =
  | { kind: "deleted" }
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

const toEmployeeMutationApiPayload = (payload: EmployeeMutationPayload) => {
  const entries: Array<[string, unknown]> = [
    ["full_name", payload.fullName],
    ["employee_code", payload.employeeCode],
    ["job_title", payload.jobTitle],
    ["country_code", payload.country],
    ["department", payload.department],
    ["employment_type", payload.employmentType],
    ["salary", payload.salary],
    ["status", payload.status],
    ["effective_from", payload.effectiveFrom],
    ["hire_date", payload.hireDate],
    ["last_salary_review_date", payload.lastSalaryReviewDate],
  ];

  return Object.fromEntries(entries.filter(([, value]) => value !== undefined));
};

const fieldKeyToCamelCase = (field: string) => {
  if (field === "salary_cents") {
    return "salary";
  }

  return field.replace(/_([a-z])/g, (_match, char: string) => char.toUpperCase());
};

const readEmployeeDetail = async (response: Response): Promise<EmployeeApiItem | undefined> => {
  try {
    const body = (await response.json()) as EmployeeDetailResponse;
    return body.data;
  } catch {
    return undefined;
  }
};

const readMutationErrors = async (response: Response) => {
  try {
    const body = (await response.json()) as EmployeeMutationErrorResponse;
    return body.errors ?? body.details ?? [];
  } catch {
    return [];
  }
};

const toValidationFieldErrors = (errors: EmployeeMutationApiError[]) =>
  Object.fromEntries(
    errors
      .filter((error) => typeof error.field === "string" && typeof error.message === "string")
      .map((error) => [fieldKeyToCamelCase(error.field as string), error.message as string]),
  );

const getDuplicateEmployeeCodeMessage = (errors: EmployeeMutationApiError[]) =>
  errors.find((error) => typeof error.message === "string")?.message ?? "Employee code has already been taken";

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

export const createEmployee = async (payload: EmployeeMutationPayload): Promise<CreateEmployeeResult> => {
  const url = `${getBackendApiBaseUrl()}/api/v1/employees`;
  const response = await authorizedFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      employee: toEmployeeMutationApiPayload(payload),
    }),
  });

  if (response.ok) {
    const employee = await readEmployeeDetail(response);

    return {
      kind: "created",
      employeeCode: employee?.employee_code ?? payload.employeeCode ?? "",
    };
  }

  const errors = await readMutationErrors(response);

  if (response.status === 422) {
    return { kind: "validation-error", fieldErrors: toValidationFieldErrors(errors) };
  }

  if (response.status === 409) {
    return {
      kind: "duplicate-employee-code",
      message: getDuplicateEmployeeCodeMessage(errors),
    };
  }

  return { kind: "error" };
};

export const updateEmployee = async (
  employeeCode: string,
  payload: EmployeeMutationPayload,
): Promise<UpdateEmployeeResult> => {
  const url = `${getBackendApiBaseUrl()}/api/v1/employees/${employeeCode}`;
  const response = await authorizedFetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      employee: toEmployeeMutationApiPayload(payload),
    }),
  });

  if (response.ok) {
    return { kind: "updated" };
  }

  const errors = await readMutationErrors(response);

  if (response.status === 422) {
    return { kind: "validation-error", fieldErrors: toValidationFieldErrors(errors) };
  }

  if (response.status === 409) {
    return {
      kind: "duplicate-employee-code",
      message: getDuplicateEmployeeCodeMessage(errors),
    };
  }

  if (response.status === 404) {
    return { kind: "not-found" };
  }

  return { kind: "error" };
};

export const deleteEmployeeByCode = async (employeeCode: string): Promise<DeleteEmployeeResult> => {
  const url = `${getBackendApiBaseUrl()}/api/v1/employees/${employeeCode}`;
  const response = await authorizedFetch(url, {
    method: "DELETE",
  });

  if (response.ok) {
    return { kind: "deleted" };
  }

  if (response.status === 404) {
    return { kind: "not-found" };
  }

  return { kind: "error" };
};

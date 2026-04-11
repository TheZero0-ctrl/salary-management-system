"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useProtectedRoute } from "../../../lib/auth/use-protected-route";
import {
  listEmployees,
  type EmployeeListItem,
} from "../../../lib/api/employees-client";
import { getRefreshToken } from "../../../lib/auth/token-store";
import {
  buildEmployeesClearFiltersUrl,
  buildEmployeesQueryFromSearchParams,
  buildEmployeesSearchUrl,
  getEmployeeFilterValuesFromSearchParams,
  type EmployeeFilterValues,
} from "../../../lib/employees/filters";
import { EmployeeFilters } from "../../../components/employees/employee-filters";

const displayValue = (value?: string) => value || "--";

type EmployeeColumn = {
  label: string;
  cellClassName: string;
  getValue: (employee: EmployeeListItem) => string;
};

const detailCellClassName = "pt-2 text-sm text-muted";

const primaryEmployeeColumns: EmployeeColumn[] = [
  {
    label: "Employee",
    cellClassName: "pt-2",
    getValue: (employee) => employee.fullName,
  },
  {
    label: "Code",
    cellClassName: detailCellClassName,
    getValue: (employee) => employee.employeeCode,
  },
  {
    label: "Department",
    cellClassName: detailCellClassName,
    getValue: (employee) => displayValue(employee.department),
  },
  {
    label: "Country",
    cellClassName: detailCellClassName,
    getValue: (employee) => displayValue(employee.country),
  },
  {
    label: "Status",
    cellClassName: detailCellClassName,
    getValue: (employee) => displayValue(employee.status),
  },
];

const EmployeesPageFallback = () => (
  <section className="w-full rounded-2xl border border-black/10 bg-surface p-6 sm:p-8">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Employees</p>
    <h1 className="mt-2 text-2xl font-semibold tracking-tight">Employee Directory</h1>
    <p className="mt-3 text-sm leading-6 text-muted">
      Directory table, filters, and pagination behavior will be added in upcoming TDD slices.
    </p>
    <p className="mt-4 text-sm text-muted">Loading employees...</p>
  </section>
);

function EmployeesPageContent() {
  useProtectedRoute();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const currentFilterValues = getEmployeeFilterValuesFromSearchParams(searchParams);
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [filterValues, setFilterValues] = useState<EmployeeFilterValues>(currentFilterValues);

  useEffect(() => {
    setFilterValues(getEmployeeFilterValuesFromSearchParams(new URLSearchParams(searchParamsKey)));
  }, [searchParamsKey]);

  useEffect(() => {
    if (!getRefreshToken()) {
      setIsLoading(false);
      return;
    }

    let isActive = true;
    const mappedQuery = buildEmployeesQueryFromSearchParams(new URLSearchParams(searchParamsKey));

    const loadEmployees = async () => {
      try {
        const employeeList = await listEmployees(mappedQuery);

        if (!isActive) {
          return;
        }

        setEmployees(Array.isArray(employeeList) ? employeeList : []);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadEmployees();

    return () => {
      isActive = false;
    };
  }, [searchParamsKey]);

  const handleSearchSubmit = () => {
    router.push(buildEmployeesSearchUrl(searchParamsKey, filterValues));
  };

  const handleClearFilters = () => {
    router.push(buildEmployeesClearFiltersUrl(searchParamsKey));
  };

  return (
    <section className="w-full rounded-2xl border border-black/10 bg-surface p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Employees</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Employee Directory</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Directory table, filters, and pagination behavior will be added in upcoming TDD slices.
      </p>
      <EmployeeFilters
        values={filterValues}
        onChange={setFilterValues}
        onSubmit={handleSearchSubmit}
        onClear={handleClearFilters}
      />
      {isLoading ? (
        <p className="mt-4 text-sm text-muted">Loading employees...</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl bg-surface">
          <table className="w-full table-fixed text-left">
            <thead>
              <tr>
                {primaryEmployeeColumns.map((column) => (
                  <th key={column.label} scope="col" className="font-medium">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.employeeCode}>
                  {primaryEmployeeColumns.map((column) => (
                    <td key={column.label} className={column.cellClassName}>
                      {column.getValue(employee)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function EmployeesPage() {
  return (
    <Suspense fallback={<EmployeesPageFallback />}>
      <EmployeesPageContent />
    </Suspense>
  );
}

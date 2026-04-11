"use client";

import { useEffect, useState } from "react";

import { useProtectedRoute } from "../../../lib/auth/use-protected-route";
import { listEmployees, type EmployeeListItem } from "../../../lib/api/employees-client";
import { getRefreshToken } from "../../../lib/auth/token-store";

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

export default function EmployeesPage() {
  useProtectedRoute();
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);

  useEffect(() => {
    if (!getRefreshToken()) {
      setIsLoading(false);
      return;
    }

    let isActive = true;

    const loadEmployees = async () => {
      try {
        const employeeList = await listEmployees();

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
  }, []);

  return (
    <section className="rounded-2xl border border-black/10 bg-surface p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Employees</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Employee Directory</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Directory table, filters, and pagination behavior will be added in upcoming TDD slices.
      </p>
      {isLoading ? (
        <p className="mt-4 text-sm text-muted">Loading employees...</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left">
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

"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useProtectedRoute } from "../../../lib/auth/use-protected-route";
import {
  deleteEmployeeByCode,
  listEmployees,
  type EmployeesPaginationMeta,
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
import { ConfirmDialog } from "../../../components/employees/confirm-dialog";
import {
  primaryButtonClassName,
  subtleTextButtonClassName,
} from "../../../components/ui/button-styles";

const displayValue = (value?: string) => value || "--";
const removeEmployeeByCode = (employeeCode: string) =>
  (employee: EmployeeListItem) => employee.employeeCode !== employeeCode;

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
  const [paginationMeta, setPaginationMeta] = useState<EmployeesPaginationMeta | null>(null);
  const [filterValues, setFilterValues] = useState<EmployeeFilterValues>(currentFilterValues);
  const [deleteTargetCode, setDeleteTargetCode] = useState<string | null>(null);
  const [isDeletingEmployee, setIsDeletingEmployee] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [deleteFeedbackMessage, setDeleteFeedbackMessage] = useState<string | null>(null);

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

        if (!employeeList) {
          setEmployees([]);
          setPaginationMeta(null);
          return;
        }

        if (Array.isArray(employeeList)) {
          setEmployees(employeeList);
          setPaginationMeta(null);
          return;
        }

        setEmployees(Array.isArray(employeeList.data) ? employeeList.data : []);
        setPaginationMeta(employeeList.meta ?? null);
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

  const handleDeleteClick = (employeeCode: string) => {
    setDeleteTargetCode(employeeCode);
    setDeleteErrorMessage(null);
  };

  const handleDeleteCancel = () => {
    if (isDeletingEmployee) {
      return;
    }

    setDeleteTargetCode(null);
    setDeleteErrorMessage(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetCode) {
      return;
    }

    setIsDeletingEmployee(true);
    setDeleteErrorMessage(null);

    try {
      const result = await deleteEmployeeByCode(deleteTargetCode);

      if (result.kind === "deleted") {
        setEmployees((previousEmployees) => previousEmployees.filter(removeEmployeeByCode(deleteTargetCode)));
        setDeleteFeedbackMessage("Employee deleted");
        setDeleteTargetCode(null);
        return;
      }

      if (result.kind === "not-found") {
        setEmployees((previousEmployees) => previousEmployees.filter(removeEmployeeByCode(deleteTargetCode)));
        setDeleteFeedbackMessage("Employee was already removed");
        setDeleteTargetCode(null);
        return;
      }

      setDeleteErrorMessage("Unable to delete employee");
    } finally {
      setIsDeletingEmployee(false);
    }
  };

  const updatePage = (nextPage: number) => {
    const nextSearchParams = new URLSearchParams(searchParamsKey);
    nextSearchParams.set("page", String(nextPage));
    const nextQuery = nextSearchParams.toString();
    router.push(nextQuery ? `/employees?${nextQuery}` : "/employees");
  };

  const currentPage = paginationMeta?.page ?? 1;
  const totalPages = paginationMeta?.totalPages ?? 1;
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;
  const pageWindowStart = Math.max(1, currentPage - 2);
  const pageWindowEnd = Math.min(totalPages, currentPage + 2);
  const pageNumbers = Array.from({ length: pageWindowEnd - pageWindowStart + 1 }, (_, index) => pageWindowStart + index);

  return (
    <section className="w-full rounded-2xl border border-black/10 bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Employees</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Employee Directory</h1>
        <Link
          href="/employees/new"
          className={primaryButtonClassName}
        >
          Create employee
        </Link>
      </div>
      <EmployeeFilters
        values={filterValues}
        onChange={setFilterValues}
        onSubmit={handleSearchSubmit}
        onClear={handleClearFilters}
      />
      {deleteFeedbackMessage ? <p className="mt-4 text-sm text-muted">{deleteFeedbackMessage}</p> : null}
      {isLoading ? (
        <p className="mt-4 text-sm text-muted">Loading employees...</p>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto rounded-xl bg-surface">
            <table className="w-full table-fixed text-left">
              <thead>
                <tr>
                  {primaryEmployeeColumns.map((column) => (
                    <th key={column.label} scope="col" className="font-medium">
                      {column.label}
                    </th>
                  ))}
                  <th scope="col" className="font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.employeeCode}>
                    {primaryEmployeeColumns.map((column) => (
                      <td key={column.label} className={column.cellClassName}>
                        {column.label === "Employee" ? (
                          <Link
                            href={`/employees/${employee.employeeCode}`}
                            className="group inline-flex items-center gap-1 font-medium text-foreground underline decoration-black/20 underline-offset-4 transition hover:decoration-black"
                            title={`View ${employee.fullName} details`}
                          >
                            {column.getValue(employee)}
                            <span aria-hidden="true" className="text-xs text-muted transition group-hover:text-foreground">
                              ↗
                            </span>
                          </Link>
                        ) : (
                          column.getValue(employee)
                        )}
                      </td>
                    ))}
                    <td className={detailCellClassName}>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/employees/${employee.employeeCode}/edit`}
                          className={`${subtleTextButtonClassName} text-black/70 hover:text-black`}
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(employee.employeeCode)}
                          className={`${subtleTextButtonClassName} text-red-700`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {paginationMeta ? (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white/30 p-3 text-sm">
              <p className="text-muted">Page {currentPage} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updatePage(currentPage - 1)}
                  disabled={!canGoPrevious}
                  className="rounded-md border border-black/10 px-3 py-1.5 font-medium disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                {pageNumbers.map((pageNumber) => {
                  const isCurrentPage = pageNumber === currentPage;

                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => updatePage(pageNumber)}
                      disabled={isCurrentPage}
                      className="rounded-md border border-black/10 px-3 py-1.5 font-medium disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => updatePage(currentPage + 1)}
                  disabled={!canGoNext}
                  className="rounded-md border border-black/10 px-3 py-1.5 font-medium disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
      <ConfirmDialog
        open={Boolean(deleteTargetCode)}
        title="Delete employee"
        description="This will remove the employee from active records. You can continue or cancel."
        confirmLabel="Delete"
        errorMessage={deleteErrorMessage}
        busy={isDeletingEmployee}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
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

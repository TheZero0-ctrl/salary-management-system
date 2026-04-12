"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { deleteEmployeeByCode, getEmployeeByCode, type GetEmployeeByCodeResult } from "../../../../lib/api/employees-client";
import { useProtectedRoute } from "../../../../lib/auth/use-protected-route";
import { getRefreshToken } from "../../../../lib/auth/token-store";
import { ConfirmDialog } from "../../../../components/employees/confirm-dialog";
import { dangerButtonClassName, secondaryButtonClassName } from "../../../../components/ui/button-styles";

const displayValue = (value?: string) => value ?? "--";
const formatSalary = (salary?: string | number) => {
  if (salary === undefined) {
    return "--";
  }

  if (typeof salary === "number") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(salary);
  }

  return salary;
};

export default function EmployeeDetailPage() {
  useProtectedRoute();
  const router = useRouter();
  const routeParams = useParams<{ employee_code?: string }>();
  const employeeCode = routeParams?.employee_code ?? "";

  const [isLoading, setIsLoading] = useState(true);
  const [employeeResult, setEmployeeResult] = useState<GetEmployeeByCodeResult | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingEmployee, setIsDeletingEmployee] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const sectionClassName = "w-full rounded-2xl border border-black/10 bg-surface p-6 sm:p-8";

  const loadEmployeeDetail = useCallback(async () => {
    if (!employeeCode) {
      setEmployeeResult({ kind: "not-found" });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const nextResult = await getEmployeeByCode(employeeCode);
      setEmployeeResult(nextResult);
    } finally {
      setIsLoading(false);
    }
  }, [employeeCode]);

  const handleRetry = useCallback(() => {
    void loadEmployeeDetail();
  }, [loadEmployeeDetail]);

  const handleDeleteEmployee = useCallback(async () => {
    setIsDeletingEmployee(true);
    setDeleteErrorMessage(null);

    try {
      const result = await deleteEmployeeByCode(employeeCode);

      if (result.kind === "deleted") {
        router.push("/employees");
        return;
      }

      if (result.kind === "not-found") {
        setEmployeeResult({ kind: "not-found" });
        return;
      }

      setDeleteErrorMessage("Unable to delete employee");
    } finally {
      setIsDeletingEmployee(false);
    }
  }, [employeeCode, router]);

  const notFoundContent = (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Employee not found</h1>
      <p className="mt-3 text-sm text-muted">Could not find an employee with this code.</p>
      <Link href="/employees" className="mt-4 inline-block text-sm font-medium text-primary underline underline-offset-4">
        Return to employee list
      </Link>
    </>
  );

  useEffect(() => {
    if (!getRefreshToken()) {
      setIsLoading(false);
      return;
    }
    void loadEmployeeDetail();
  }, [loadEmployeeDetail]);

  if (isLoading) {
    return (
      <section className={sectionClassName}>
        <p className="text-sm text-muted">Loading employee details...</p>
      </section>
    );
  }

  if (employeeResult?.kind === "not-found") {
    return <section className={sectionClassName}>{notFoundContent}</section>;
  }

  if (employeeResult?.kind === "found") {
    const { employee } = employeeResult;
    const profileItems = [
      { label: "Employee ID", value: employee.id === undefined ? "--" : String(employee.id) },
      { label: "Code", value: employee.employeeCode },
      { label: "Department", value: displayValue(employee.department) },
      { label: "Job title", value: displayValue(employee.jobTitle) },
    ];
    const compensationItems = [
      { label: "Country", value: displayValue(employee.country) },
      { label: "Status", value: displayValue(employee.status) },
      { label: "Employment type", value: displayValue(employee.employmentType) },
      { label: "Salary", value: formatSalary(employee.salary) },
      { label: "Effective from", value: displayValue(employee.effectiveFrom) },
      { label: "Hire date", value: displayValue(employee.hireDate) },
      { label: "Last salary review date", value: displayValue(employee.lastSalaryReviewDate) },
    ];

    return (
      <>
        <section className={sectionClassName}>
          <h1 className="text-2xl font-semibold tracking-tight">{employee.fullName}</h1>
          <div className="mt-4 flex items-center gap-2">
            <Link
              href={`/employees/${employee.employeeCode}/edit`}
              className={secondaryButtonClassName}
            >
              Edit employee
            </Link>
            <button
              type="button"
              onClick={() => setIsDeleteDialogOpen(true)}
              className={dangerButtonClassName}
            >
              Delete employee
            </button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-black/10 bg-white/30 p-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Profile</h2>
              <dl className="mt-4 space-y-3 text-sm">
                {profileItems.map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-muted">{label}</dt>
                    <dd className="font-medium text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className="rounded-xl border border-black/10 bg-white/30 p-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Compensation</h2>
              <dl className="mt-4 space-y-3 text-sm">
                {compensationItems.map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-muted">{label}</dt>
                    <dd className="font-medium text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </section>
        <ConfirmDialog
          open={isDeleteDialogOpen}
          title="Delete employee"
          description="This action removes the employee from active records."
          confirmLabel="Delete"
          errorMessage={deleteErrorMessage}
          busy={isDeletingEmployee}
          onConfirm={handleDeleteEmployee}
          onCancel={() => {
            if (isDeletingEmployee) {
              return;
            }

            setIsDeleteDialogOpen(false);
            setDeleteErrorMessage(null);
          }}
        />
      </>
    );
  }

  if (employeeResult?.kind === "error") {
    return (
      <section className={sectionClassName}>
        <h1 className="text-2xl font-semibold tracking-tight">Unable to load employee details</h1>
        <p className="mt-3 text-sm text-muted">Please try again in a moment.</p>
        <button
          type="button"
          onClick={handleRetry}
          className={`mt-4 ${secondaryButtonClassName}`}
        >
          Retry
        </button>
      </section>
    );
  }

  return <section className={sectionClassName}>{notFoundContent}</section>;
}

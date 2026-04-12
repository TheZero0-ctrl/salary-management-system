import { type SubmitEvent } from "react";
import { primaryButtonClassName } from "../../../components/ui/button-styles";

export type EmployeeFormValues = {
  fullName: string;
  employeeCode: string;
  jobTitle?: string;
  country?: string;
  department?: string;
  employmentType?: string;
  salary?: string;
  status?: string;
  effectiveFrom?: string;
  hireDate?: string;
  lastSalaryReviewDate?: string;
};

export type EmployeeFormErrors = {
  fullName?: string;
  employeeCode?: string;
  jobTitle?: string;
  country?: string;
  department?: string;
  employmentType?: string;
  salary?: string;
  status?: string;
  effectiveFrom?: string;
  hireDate?: string;
  lastSalaryReviewDate?: string;
};

type EmployeeFormProps = {
  title: string;
  submitLabel: string;
  values: EmployeeFormValues;
  errors?: EmployeeFormErrors;
  formError?: string | null;
  showDepartmentField?: boolean;
  showExtendedFields?: boolean;
  isSubmitting?: boolean;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  onFullNameChange: (value: string) => void;
  onEmployeeCodeChange: (value: string) => void;
  onDepartmentChange?: (value: string) => void;
  onJobTitleChange?: (value: string) => void;
  onCountryChange?: (value: string) => void;
  onEmploymentTypeChange?: (value: string) => void;
  onSalaryChange?: (value: string) => void;
  onStatusChange?: (value: string) => void;
  onEffectiveFromChange?: (value: string) => void;
  onHireDateChange?: (value: string) => void;
  onLastSalaryReviewDateChange?: (value: string) => void;
};

const FieldError = ({ message }: { message?: string }) => {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-red-700">{message}</p>;
};

export function EmployeeForm({
  title,
  submitLabel,
  values,
  errors,
  formError,
  showDepartmentField = false,
  showExtendedFields = false,
  isSubmitting = false,
  onSubmit,
  onFullNameChange,
  onEmployeeCodeChange,
  onDepartmentChange,
  onJobTitleChange,
  onCountryChange,
  onEmploymentTypeChange,
  onSalaryChange,
  onStatusChange,
  onEffectiveFromChange,
  onHireDateChange,
  onLastSalaryReviewDateChange,
}: EmployeeFormProps) {
  return (
    <section className="w-full rounded-2xl border border-black/10 bg-surface p-6 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <form className="mt-6 space-y-6" onSubmit={onSubmit}>
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Basic information</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="full-name" className="text-sm font-medium">
                Full name
              </label>
              <input
                id="full-name"
                name="fullName"
                type="text"
                placeholder="Ada Lovelace"
                maxLength={120}
                value={values.fullName}
                onChange={(event) => onFullNameChange(event.currentTarget.value)}
                className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
              />
              <FieldError message={errors?.fullName} />
            </div>

            <div className="space-y-2">
              <label htmlFor="employee-code" className="text-sm font-medium">
                Employee code
              </label>
              <input
                id="employee-code"
                name="employeeCode"
                type="text"
                placeholder="EMP-0001"
                maxLength={32}
                value={values.employeeCode}
                onChange={(event) => onEmployeeCodeChange(event.currentTarget.value.toUpperCase())}
                className="w-full rounded-md border border-black/10 px-3 py-2 font-mono text-sm"
              />
              <FieldError message={errors?.employeeCode} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Employment details</p>
          <div className="grid gap-4 md:grid-cols-2">
            {showDepartmentField ? (
              <div className="space-y-2">
                <label htmlFor="department" className="text-sm font-medium">
                  Department
                </label>
                <input
                  id="department"
                  name="department"
                  type="text"
                  placeholder="Engineering"
                  value={values.department ?? ""}
                  onChange={(event) => onDepartmentChange?.(event.currentTarget.value)}
                  className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
                />
                <FieldError message={errors?.department} />
              </div>
            ) : null}

            {showExtendedFields ? (
              <>
                <div className="space-y-2">
                  <label htmlFor="job-title" className="text-sm font-medium">
                    Job title
                  </label>
                  <input
                    id="job-title"
                    name="jobTitle"
                    type="text"
                    placeholder="Staff Engineer"
                    maxLength={120}
                    value={values.jobTitle ?? ""}
                    onChange={(event) => onJobTitleChange?.(event.currentTarget.value)}
                    className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
                  />
                  <FieldError message={errors?.jobTitle} />
                </div>

                <div className="space-y-2">
                  <label htmlFor="country" className="text-sm font-medium">
                    Country
                  </label>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    placeholder="IN"
                    maxLength={2}
                    value={values.country ?? ""}
                    onChange={(event) => onCountryChange?.(event.currentTarget.value.toUpperCase())}
                    className="w-full rounded-md border border-black/10 px-3 py-2 uppercase text-sm"
                  />
                  <FieldError message={errors?.country} />
                </div>

                <div className="space-y-2">
                  <label htmlFor="employment-type" className="text-sm font-medium">
                    Employment type
                  </label>
                  <select
                    id="employment-type"
                    name="employmentType"
                    value={values.employmentType ?? ""}
                    onChange={(event) => onEmploymentTypeChange?.(event.currentTarget.value)}
                    className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Select type</option>
                    <option value="full_time">Full-time</option>
                    <option value="part_time">Part-time</option>
                    <option value="contractor">Contractor</option>
                  </select>
                  <FieldError message={errors?.employmentType} />
                </div>

                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-medium">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={values.status ?? ""}
                    onChange={(event) => onStatusChange?.(event.currentTarget.value)}
                    className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Select status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="terminated">Terminated</option>
                  </select>
                  <FieldError message={errors?.status} />
                </div>

                <div className="space-y-2">
                  <label htmlFor="salary" className="text-sm font-medium">
                    Salary (USD annual)
                  </label>
                  <input
                    id="salary"
                    name="salary"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="50000"
                    value={values.salary ?? ""}
                    onChange={(event) => onSalaryChange?.(event.currentTarget.value)}
                    className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-muted">Enter yearly salary in USD.</p>
                  <FieldError message={errors?.salary} />
                </div>

                <div className="space-y-2">
                  <label htmlFor="effective-from" className="text-sm font-medium">
                    Effective from
                  </label>
                  <input
                    id="effective-from"
                    name="effectiveFrom"
                    type="date"
                    value={values.effectiveFrom ?? ""}
                    onChange={(event) => onEffectiveFromChange?.(event.currentTarget.value)}
                    className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
                  />
                  <FieldError message={errors?.effectiveFrom} />
                </div>

                <div className="space-y-2">
                  <label htmlFor="hire-date" className="text-sm font-medium">
                    Hire date
                  </label>
                  <input
                    id="hire-date"
                    name="hireDate"
                    type="date"
                    value={values.hireDate ?? ""}
                    onChange={(event) => onHireDateChange?.(event.currentTarget.value)}
                    className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
                  />
                  <FieldError message={errors?.hireDate} />
                </div>

                <div className="space-y-2">
                  <label htmlFor="last-salary-review-date" className="text-sm font-medium">
                    Last salary review date
                  </label>
                  <input
                    id="last-salary-review-date"
                    name="lastSalaryReviewDate"
                    type="date"
                    value={values.lastSalaryReviewDate ?? ""}
                    onChange={(event) => onLastSalaryReviewDateChange?.(event.currentTarget.value)}
                    className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
                  />
                  <FieldError message={errors?.lastSalaryReviewDate} />
                </div>
              </>
            ) : null}
          </div>
        </div>

        <FieldError message={formError ?? undefined} />

        <button
          type="submit"
          disabled={isSubmitting}
          className={primaryButtonClassName}
        >
          {submitLabel}
        </button>
      </form>
    </section>
  );
}

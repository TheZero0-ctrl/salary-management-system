import { type SubmitEvent } from "react";
import type { EmployeeFilterValues } from "../../lib/employees/filters";
import { primaryButtonClassName, secondaryButtonClassName } from "../ui/button-styles";

type EmployeeFilterOptions = {
  countryCodes: string[];
  jobTitles: string[];
  departments: string[];
};

type EmployeeFiltersProps = {
  values: EmployeeFilterValues;
  options: EmployeeFilterOptions;
  onChange: (nextValues: EmployeeFilterValues) => void;
  onSubmit: () => void;
  onClear: () => void;
};

export const EmployeeFilters = ({ values, options, onChange, onSubmit, onClear }: EmployeeFiltersProps) => {
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="mt-4 rounded-xl border border-black/10 bg-white/70 p-4" onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="flex flex-col gap-1">
          <label htmlFor="employees-search" className="text-sm text-muted">
            Search
          </label>
          <input
            id="employees-search"
            type="text"
            value={values.search}
            onChange={(event) => onChange({ ...values, search: event.target.value })}
            placeholder="Name or employee code"
            className="h-10 rounded-lg border border-black/15 bg-surface px-3 text-sm outline-none focus:border-black/30"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="employees-country" className="text-sm text-muted">
            Country
          </label>
          <select
            id="employees-country"
            value={values.countryCode}
            onChange={(event) => onChange({ ...values, countryCode: event.target.value })}
            className="h-10 rounded-lg border border-black/15 bg-surface px-3 text-sm outline-none focus:border-black/30"
          >
            <option value="">All countries</option>
            {options.countryCodes.map((countryCode) => (
              <option key={countryCode} value={countryCode}>
                {countryCode}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="employees-job-title" className="text-sm text-muted">
            Job title
          </label>
          <select
            id="employees-job-title"
            value={values.jobTitle}
            onChange={(event) => onChange({ ...values, jobTitle: event.target.value })}
            className="h-10 rounded-lg border border-black/15 bg-surface px-3 text-sm outline-none focus:border-black/30"
          >
            <option value="">All job titles</option>
            {options.jobTitles.map((jobTitle) => (
              <option key={jobTitle} value={jobTitle}>
                {jobTitle}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="employees-department" className="text-sm text-muted">
            Department
          </label>
          <select
            id="employees-department"
            value={values.department}
            onChange={(event) => onChange({ ...values, department: event.target.value })}
            className="h-10 rounded-lg border border-black/15 bg-surface px-3 text-sm outline-none focus:border-black/30"
          >
            <option value="">All departments</option>
            {options.departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="employees-status" className="text-sm text-muted">
            Status
          </label>
          <select
            id="employees-status"
            value={values.status}
            onChange={(event) => onChange({ ...values, status: event.target.value })}
            className="h-10 rounded-lg border border-black/15 bg-surface px-3 text-sm outline-none focus:border-black/30"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClear}
          className={secondaryButtonClassName}
        >
          Clear filters
        </button>
        <button
          type="submit"
          className={primaryButtonClassName}
        >
          Search
        </button>
      </div>
    </form>
  );
};

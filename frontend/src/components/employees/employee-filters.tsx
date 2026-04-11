import { type FormEvent } from "react";
import type { EmployeeFilterValues } from "../../lib/employees/filters";

type EmployeeFiltersProps = {
  values: EmployeeFilterValues;
  onChange: (nextValues: EmployeeFilterValues) => void;
  onSubmit: () => void;
  onClear: () => void;
};

export const EmployeeFilters = ({ values, onChange, onSubmit, onClear }: EmployeeFiltersProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="mt-4 rounded-xl border border-black/10 bg-white/70 p-4" onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          <input
            id="employees-country"
            type="text"
            value={values.countryCode}
            onChange={(event) => onChange({ ...values, countryCode: event.target.value })}
            placeholder="ISO code (e.g. IN)"
            className="h-10 rounded-lg border border-black/15 bg-surface px-3 text-sm uppercase outline-none focus:border-black/30"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="employees-department" className="text-sm text-muted">
            Department
          </label>
          <input
            id="employees-department"
            type="text"
            value={values.department}
            onChange={(event) => onChange({ ...values, department: event.target.value })}
            placeholder="Engineering"
            className="h-10 rounded-lg border border-black/15 bg-surface px-3 text-sm outline-none focus:border-black/30"
          />
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
          className="h-10 rounded-lg border border-black/15 px-4 text-sm font-medium text-foreground hover:bg-black/[0.03]"
        >
          Clear filters
        </button>
        <button
          type="submit"
          className="h-10 rounded-lg bg-black px-4 text-sm font-medium text-white hover:bg-black/85"
        >
          Search
        </button>
      </div>
    </form>
  );
};

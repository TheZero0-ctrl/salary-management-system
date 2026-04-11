"use client";

import { useProtectedRoute } from "../../lib/auth/use-protected-route";

export default function EmployeesPage() {
  useProtectedRoute();

  return (
    <section className="rounded-2xl border border-black/10 bg-surface p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Employees</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Employee Directory</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Directory table, filters, and pagination behavior will be added in upcoming TDD slices.
      </p>
    </section>
  );
}

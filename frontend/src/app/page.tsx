import Link from "next/link";

export default function Home() {
  return (
    <section className="grid gap-6 rounded-2xl border border-black/10 bg-surface p-6 sm:p-8 lg:grid-cols-[1.25fr_1fr]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Overview</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Salary operations workspace for HR teams.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
          The base shell and theme are ready. Feature behavior will be added in small,
          test-driven slices.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background" href="/login">
            Go to Login
          </Link>
          <Link className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium" href="/employees">
            Employees
          </Link>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Planned modules</h2>
        <ul className="mt-4 space-y-3 text-sm text-muted">
          <li className="rounded-lg border border-line bg-background px-3 py-2">Auth and session handling</li>
          <li className="rounded-lg border border-line bg-background px-3 py-2">Employee directory and filters</li>
          <li className="rounded-lg border border-line bg-background px-3 py-2">Create/edit employee workflows</li>
          <li className="rounded-lg border border-line bg-background px-3 py-2">Insights dashboard</li>
        </ul>
      </div>
    </section>
  );
}

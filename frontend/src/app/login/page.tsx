"use client";

import { SubmitEvent, useState } from "react";

type LoginField = "email" | "password";
type ValidationErrors = Partial<Record<LoginField, string>>;

const REQUIRED_MESSAGES: Record<LoginField, string> = {
  email: "Email is required",
  password: "Password is required",
};

const getTrimmedFormValue = (formData: FormData, field: LoginField) =>
  String(formData.get(field) ?? "").trim();

const validateLoginForm = (email: string, password: string): ValidationErrors => {
  const nextErrors: ValidationErrors = {};

  if (!email) {
    nextErrors.email = REQUIRED_MESSAGES.email;
  }

  if (!password) {
    nextErrors.password = REQUIRED_MESSAGES.password;
  }

  return nextErrors;
};

export default function LoginPage() {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = getTrimmedFormValue(formData, "email");
    const password = getTrimmedFormValue(formData, "password");

    setErrors(validateLoginForm(email, password));
  };

  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border border-line bg-surface/95 p-6 shadow-sm sm:p-8">
      <div className="mb-5 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Welcome back</p>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted">Use your HR account credentials to continue.</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground focus:ring-2 focus:ring-foreground/15"
            id="email"
            name="email"
            type="email"
            autoComplete="username"
          />
          {errors.email ? (
            <p className="rounded-md bg-red-50 px-2 py-1 text-sm text-red-700">{errors.email}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground focus:ring-2 focus:ring-foreground/15"
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
          />
          {errors.password ? (
            <p className="rounded-md bg-red-50 px-2 py-1 text-sm text-red-700">{errors.password}</p>
          ) : null}
        </div>

        <button
          className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:opacity-95"
          type="submit"
        >
          Sign in
        </button>
      </form>
    </section>
  );
}

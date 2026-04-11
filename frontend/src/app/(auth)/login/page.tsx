"use client";

import { SubmitEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createSession } from "../../../lib/api/session";
import { getRefreshToken, setAccessToken, setRefreshToken } from "../../../lib/auth/token-store";

type LoginField = "email" | "password";
type ValidationErrors = Partial<Record<LoginField, string>>;

const DEFAULT_AUTH_ERROR = "Invalid email or password";
const INLINE_ERROR_CLASS = "rounded-md bg-red-50 px-2 py-1 text-sm text-red-700";

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

const hasValidationErrors = (errors: ValidationErrors) => Object.keys(errors).length > 0;

const getAuthErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as { message?: unknown };

    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }
  } catch {}

  return DEFAULT_AUTH_ERROR;
};

type SessionResponseBody = {
  access_token?: unknown;
  refresh_token?: unknown;
};

const persistSessionTokens = (data: SessionResponseBody) => {
  if (typeof data.access_token === "string") {
    setAccessToken(data.access_token);
  }

  if (typeof data.refresh_token === "string") {
    setRefreshToken(data.refresh_token);
  }
};

const InlineError = ({ message }: { message: string }) => (
  <p className={INLINE_ERROR_CLASS} role="alert">
    {message}
  </p>
);

export default function LoginPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (getRefreshToken()) {
      router.replace("/employees");
    }
  }, [router]);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = getTrimmedFormValue(formData, "email");
    const password = getTrimmedFormValue(formData, "password");

    const validationErrors = validateLoginForm(email, password);
    setErrors(validationErrors);

    if (hasValidationErrors(validationErrors)) {
      return;
    }

    setAuthError(null);
    setIsSubmitting(true);

    try {
      const response = await createSession(email, password);

      if (response.ok) {
        const data = (await response.json()) as SessionResponseBody;
        persistSessionTokens(data);

        router.push("/employees");
        return;
      }

      setAuthError(await getAuthErrorMessage(response));
    } catch {
      setAuthError(DEFAULT_AUTH_ERROR);
    } finally {
      setIsSubmitting(false);
    }
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
          {errors.email ? <InlineError message={errors.email} /> : null}
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
          {errors.password ? <InlineError message={errors.password} /> : null}
        </div>

        <button
          className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
        {authError ? <InlineError message={authError} /> : null}
      </form>
    </section>
  );
}

type ApiErrorDetail = {
  field?: string
  message?: string
}

type ApiErrorBody = {
  error?: {
    details?: ApiErrorDetail[]
  }
}

type PresentApiErrorInput = {
  status: number
  body?: ApiErrorBody | null
}

type PresentedValidationError = {
  kind: "validation-error"
  fieldErrors: {
    countryCode?: string
    jobTitle?: string
    bucketSize?: string
  }
}

type PresentedApiError =
  | PresentedValidationError
  | { kind: "not-found" }
  | { kind: "conflict" }
  | { kind: "unauthorized" }
  | { kind: "error" }

const API_FIELD_TO_UI_FIELD = {
  country_code: "countryCode",
  job_title: "jobTitle",
  bucket_size: "bucketSize",
} as const satisfies Record<string, keyof PresentedValidationError["fieldErrors"]>

const knownFieldToCamelCase = (field: string) => {
  return API_FIELD_TO_UI_FIELD[field as keyof typeof API_FIELD_TO_UI_FIELD] ?? null
}

const hasFieldAndMessage = (detail: ApiErrorDetail): detail is { field: string; message: string } => {
  return typeof detail.field === "string" && typeof detail.message === "string"
}

export const extractRequestId = (headers: Headers): string | null => {
  return headers.get("x-request-id") ?? headers.get("x-correlation-id")
}

export const presentApiError = ({ status, body }: PresentApiErrorInput): PresentedApiError => {
  if (status === 400 || status === 422) {
    const fieldErrors = Object.fromEntries(
      (body?.error?.details ?? [])
        .filter(hasFieldAndMessage)
        .map((detail) => [knownFieldToCamelCase(detail.field), detail.message] as const)
        .filter(
          (
            entry,
          ): entry is readonly [keyof PresentedValidationError["fieldErrors"], string] => entry[0] !== null,
        ),
    ) as PresentedValidationError["fieldErrors"]

    return {
      kind: "validation-error",
      fieldErrors,
    }
  }

  if (status === 404) {
    return { kind: "not-found" }
  }

  if (status === 409) {
    return { kind: "conflict" }
  }

  if (status === 401) {
    return { kind: "unauthorized" }
  }

  return { kind: "error" }
}

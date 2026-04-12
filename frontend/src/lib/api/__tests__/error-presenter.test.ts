import { describe, expect, it } from "vitest"

import { extractRequestId, presentApiError } from "../error-presenter"

describe("error-presenter", () => {
  describe("presentApiError", () => {
    it("maps 400 and 422 responses to validation-error with fieldErrors", () => {
      const badRequestResult = presentApiError({
        status: 400,
        body: {
          error: {
            details: [{ field: "country_code", message: "must be a valid ISO alpha-2 code" }],
          },
        },
      })

      const unprocessableEntityResult = presentApiError({
        status: 422,
        body: {
          error: {
            details: [{ field: "job_title", message: "can't be blank" }],
          },
        },
      })

      expect(badRequestResult).toEqual({
        kind: "validation-error",
        fieldErrors: {
          countryCode: "must be a valid ISO alpha-2 code",
        },
      })
      expect(unprocessableEntityResult).toEqual({
        kind: "validation-error",
        fieldErrors: {
          jobTitle: "can't be blank",
        },
      })
    })

    it("maps 404 responses to not-found", () => {
      const result = presentApiError({ status: 404, body: { error: { message: "Not found" } } })

      expect(result).toEqual({ kind: "not-found" })
    })

    it("maps 409 responses to conflict", () => {
      const result = presentApiError({ status: 409, body: { error: { message: "Conflict" } } })

      expect(result).toEqual({ kind: "conflict" })
    })

    it("maps 401 responses to unauthorized", () => {
      const result = presentApiError({ status: 401, body: { error: { message: "Unauthorized" } } })

      expect(result).toEqual({ kind: "unauthorized" })
    })

    it("maps 500 and unknown status responses to generic error", () => {
      const internalServerError = presentApiError({ status: 500, body: { error: { message: "Internal" } } })
      const unknownStatus = presentApiError({ status: 418, body: { error: { message: "I'm a teapot" } } })

      expect(internalServerError).toEqual({ kind: "error" })
      expect(unknownStatus).toEqual({ kind: "error" })
    })
  })

  describe("extractRequestId", () => {
    it("returns x-request-id when present", () => {
      const headers = new Headers({ "x-request-id": "req-123" })

      expect(extractRequestId(headers)).toBe("req-123")
    })

    it("falls back to x-correlation-id when x-request-id is missing", () => {
      const headers = new Headers({ "x-correlation-id": "corr-456" })

      expect(extractRequestId(headers)).toBe("corr-456")
    })

    it("returns null when neither request id header is present", () => {
      const headers = new Headers({ "content-type": "application/json" })

      expect(extractRequestId(headers)).toBeNull()
    })
  })
})

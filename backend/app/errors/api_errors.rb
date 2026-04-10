# frozen_string_literal: true

module ApiErrors
  DEFINITIONS = {
    bad_request: {
      status: :bad_request,
      code: "BAD_REQUEST",
      message: "Invalid query parameter"
    },
    unauthenticated: {
      status: :unauthorized,
      code: "UNAUTHENTICATED",
      message: "Unauthorized"
    },
    forbidden: {
      status: :forbidden,
      code: "FORBIDDEN",
      message: "You are not allowed to perform this action"
    },
    not_found: {
      status: :not_found,
      code: "NOT_FOUND",
      message: "Resource not found"
    },
    employee_not_found: {
      status: :not_found,
      code: "EMPLOYEE_NOT_FOUND",
      message: "Employee not found"
    },
    validation_error: {
      status: :unprocessable_content,
      code: "VALIDATION_ERROR",
      message: "Validation failed"
    },
    duplicate_employee_code: {
      status: :conflict,
      code: "DUPLICATE_EMPLOYEE_CODE",
      message: "Employee code has already been taken"
    },
    rate_limited: {
      status: :too_many_requests,
      code: "RATE_LIMITED",
      message: "Too many login attempts. Try again later."
    }
  }.freeze

  def self.fetch(key)
    DEFINITIONS.fetch(key)
  end
end

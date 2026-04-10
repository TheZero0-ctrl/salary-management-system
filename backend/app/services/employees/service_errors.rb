# frozen_string_literal: true

module Employees
  module ServiceErrors
    private

    def duplicate_employee_code_error
      definition = ApiErrors.fetch(:duplicate_employee_code)

      ServiceResult.failure(
        status: definition.fetch(:status),
        error: definition.fetch(:message),
        error_code: definition.fetch(:code),
        details: [ { field: "employee_code", message: "has already been taken" } ]
      )
    end

    def validation_error_for(record)
      definition = ApiErrors.fetch(:validation_error)

      ServiceResult.failure(
        status: definition.fetch(:status),
        error: definition.fetch(:message),
        error_code: definition.fetch(:code),
        details: record.errors.map { |error| { field: error.attribute.to_s, message: error.message } }
      )
    end
  end
end

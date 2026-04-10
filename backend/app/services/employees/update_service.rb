# frozen_string_literal: true

module Employees
  class UpdateService < ApplicationService
    Result = Struct.new(:employee, :error, :status, :error_code, :details, keyword_init: true) do
      def success?
        status == :ok
      end

      def details
        self[:details] || []
      end
    end

    def initialize(employee:, params:)
      @employee = employee
      @params = params
    end

    def call
      if employee.update(params)
        success_result
      elsif employee.errors.of_kind?(:employee_code, :taken)
        duplicate_code_result
      else
        validation_error_result
      end
    end

    private

    attr_reader :employee, :params

    def success_result
      Result.new(employee:, status: :ok)
    end

    def duplicate_code_result
      Result.new(
        error: "Employee code has already been taken",
        status: :conflict,
        error_code: "DUPLICATE_EMPLOYEE_CODE",
        details: [ { field: "employee_code", message: "has already been taken" } ]
      )
    end

    def validation_error_result
      Result.new(
        error: "Validation failed",
        status: :unprocessable_entity,
        error_code: "VALIDATION_ERROR",
        details: employee.errors.map { |error| { field: error.attribute.to_s, message: error.message } }
      )
    end
  end
end

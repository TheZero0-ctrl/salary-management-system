# frozen_string_literal: true

module Employees
  class UpdateService < ApplicationService
    include ServiceErrors

    def initialize(employee:, params:)
      @employee = employee
      @params = params
    end

    def call
      if employee.update(sanitized_params)
        success_result
      elsif employee.errors.of_kind?(:employee_code, :taken)
        duplicate_employee_code_error
      else
        validation_error_for(employee)
      end
    rescue ActiveRecord::RecordNotUnique
      duplicate_employee_code_error
    end

    private

    attr_reader :employee, :params

    def sanitized_params
      attrs = params.to_h.symbolize_keys
      return attrs unless attrs.key?(:salary)

      attrs[:salary_cents] = MoneyAmount.dollars_to_cents(attrs.delete(:salary))
      attrs
    end

    def success_result
      ServiceResult.success(status: :ok, employee: employee)
    end
  end
end

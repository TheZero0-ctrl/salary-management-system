# frozen_string_literal: true

module Employees
  class UpdateService < ApplicationService
    include ServiceErrors

    def initialize(employee:, params:)
      @employee = employee
      @params = params
    end

    def call
      if employee.update(params)
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

    def success_result
      ServiceResult.success(status: :ok, employee: employee)
    end
  end
end

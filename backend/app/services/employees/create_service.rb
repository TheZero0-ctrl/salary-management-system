# frozen_string_literal: true

module Employees
  class CreateService < ApplicationService
    include ServiceErrors

    def initialize(params:)
      @params = params
    end

    def call
      employee = Employee.new(sanitized_params)

      if employee.save
        success_result(employee)
      elsif employee.errors.of_kind?(:employee_code, :taken)
        duplicate_employee_code_error
      else
        validation_error_for(employee)
      end
    rescue ActiveRecord::RecordNotUnique
      duplicate_employee_code_error
    end

    private

    attr_reader :params

    def sanitized_params
      attrs = params.to_h.symbolize_keys
      return attrs unless attrs.key?(:salary)

      attrs[:salary_cents] = (attrs.delete(:salary).to_f * 100).round
      attrs
    end

    def success_result(employee)
      ServiceResult.success(status: :created, employee: employee)
    end
  end
end

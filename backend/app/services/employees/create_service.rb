# frozen_string_literal: true

module Employees
  class CreateService < ApplicationService
    include ServiceErrors

    def initialize(params:)
      @params = params
    end

    def call
      employee = Employee.new(params)

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

    def success_result(employee)
      ServiceResult.success(status: :created, employee: employee)
    end
  end
end

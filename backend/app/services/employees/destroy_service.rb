# frozen_string_literal: true

module Employees
  class DestroyService < ApplicationService
    include ServiceErrors

    def initialize(employee:)
      @employee = employee
    end

    def call
      employee.soft_delete!
      success_result
    rescue ActiveRecord::RecordInvalid
      validation_error_result
    end

    private

    attr_reader :employee

    def success_result
      ServiceResult.success(status: :no_content)
    end

    def validation_error_result
      validation_error_for(employee)
    end
  end
end

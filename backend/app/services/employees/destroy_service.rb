# frozen_string_literal: true

module Employees
  class DestroyService < ApplicationService
    Result = Struct.new(:error, :status, :error_code, :details, keyword_init: true) do
      def success?
        status == :no_content
      end

      def details
        self[:details] || []
      end
    end

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
      Result.new(status: :no_content)
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

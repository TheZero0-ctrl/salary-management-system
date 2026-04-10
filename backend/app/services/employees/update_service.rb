# frozen_string_literal: true

module Employees
  class UpdateService
    Result = Struct.new(:employee, :error, :status, keyword_init: true) do
      def success?
        status == :ok
      end
    end

    def self.call(...)
      new(...).call
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
      Result.new(error: "Employee code has already been taken", status: :conflict)
    end

    def validation_error_result
      Result.new(error: employee.errors.full_messages.to_sentence, status: :unprocessable_entity)
    end
  end
end

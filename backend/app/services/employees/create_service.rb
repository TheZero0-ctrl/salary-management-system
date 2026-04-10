# frozen_string_literal: true

module Employees
  class CreateService
    Result = Struct.new(:employee, :error, :status, keyword_init: true) do
      def success?
        status == :created
      end
    end

    def self.call(...)
      new(...).call
    end

    def initialize(params:)
      @params = params
    end

    def call
      employee = Employee.new(params)

      if employee.save
        success_result(employee)
      elsif employee.errors.of_kind?(:employee_code, :taken)
        duplicate_code_result
      else
        validation_error_result(employee)
      end
    end

    private

    attr_reader :params

    def success_result(employee)
      Result.new(employee:, status: :created)
    end

    def duplicate_code_result
      Result.new(error: "Employee code has already been taken", status: :conflict)
    end

    def validation_error_result(employee)
      Result.new(error: employee.errors.full_messages.to_sentence, status: :unprocessable_entity)
    end
  end
end

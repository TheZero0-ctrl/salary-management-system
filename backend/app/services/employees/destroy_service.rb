# frozen_string_literal: true

module Employees
  class DestroyService
    Result = Struct.new(:error, :status, keyword_init: true) do
      def success?
        status == :no_content
      end
    end

    def self.call(...)
      new(...).call
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
      Result.new(error: employee.errors.full_messages.to_sentence, status: :unprocessable_entity)
    end
  end
end

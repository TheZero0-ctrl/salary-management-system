# frozen_string_literal: true

class ServiceResult
  attr_reader :status, :error, :error_code, :details, :employee

  def initialize(status:, error: nil, error_code: nil, details: [], employee: nil)
    @status = status
    @error = error
    @error_code = error_code
    @details = details
    @employee = employee
  end

  def success?
    error.nil?
  end

  def self.success(status:, employee: nil)
    new(status:, employee:)
  end

  def self.failure(status:, error:, error_code:, details: [])
    new(status:, error:, error_code:, details:)
  end
end

# frozen_string_literal: true

module Seeding
  class BootstrapService < ApplicationService
    DEFAULT_COUNT = 10_000
    DEFAULT_SEED = 42
    DEFAULT_BATCH_SIZE = 1_000
    DEFAULT_HR_EMAIL = "hr_manager@example.com"
    DEFAULT_HR_PASSWORD = "password123"

    Result = Struct.new(
      :hr_manager_status,
      :employee_result,
      :duration_seconds,
      :throughput,
      keyword_init: true
    )

    def initialize(
      count: DEFAULT_COUNT,
      seed: DEFAULT_SEED,
      batch_size: DEFAULT_BATCH_SIZE,
      hr_email: DEFAULT_HR_EMAIL,
      hr_password: DEFAULT_HR_PASSWORD,
      logger: Rails.logger
    )
      @count = count
      @seed = seed
      @batch_size = batch_size
      @hr_email = hr_email
      @hr_password = hr_password
      @logger = logger
    end

    def call
      started_at = monotonic_time
      hr_manager_status = ensure_hr_manager!

      employee_records = Employees::DatasetGenerator.call(count: count, seed: seed)
      employee_result = Employees::BulkUpsertService.call(records: employee_records, batch_size: batch_size)

      duration_seconds = monotonic_time - started_at
      throughput = throughput_for(employee_result.total, duration_seconds)

      log_result(hr_manager_status, employee_result, duration_seconds, throughput)

      Result.new(
        hr_manager_status: hr_manager_status,
        employee_result: employee_result,
        duration_seconds: duration_seconds.round(3),
        throughput: throughput
      )
    end

    private

    attr_reader :count, :seed, :batch_size, :hr_email, :hr_password, :logger

    def ensure_hr_manager!
      user = User.find_or_initialize_by(email_address: hr_email)
      was_new_record = user.new_record?

      user.role = "hr_manager"
      user.password = hr_password if user.encrypted_password.blank?

      return :skipped unless user.changed?

      user.save!
      was_new_record ? :created : :updated
    end

    def log_result(hr_manager_status, employee_result, duration_seconds, throughput)
      logger.info(
        "[seeding] hr_manager=#{hr_manager_status} total=#{employee_result.total} " \
        "created=#{employee_result.created} updated=#{employee_result.updated} " \
        "skipped=#{employee_result.skipped} failed=#{employee_result.failed} " \
        "runtime_seconds=#{duration_seconds.round(3)} throughput_per_second=#{throughput}"
      )
    end

    def throughput_for(total, duration_seconds)
      return total.to_f if duration_seconds.zero?

      (total / duration_seconds).round(2)
    end

    def monotonic_time
      Process.clock_gettime(Process::CLOCK_MONOTONIC)
    end
  end
end

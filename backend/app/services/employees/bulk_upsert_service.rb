# frozen_string_literal: true

module Employees
  class BulkUpsertService < ApplicationService
    DEFAULT_BATCH_SIZE = 1_000

    UPSERT_ATTRIBUTES = %i[
      employee_code
      full_name
      job_title
      country_code
      salary_cents
      employment_type
      effective_from
      status
      department
      hire_date
      last_salary_review_date
      deleted_at
    ].freeze

    Result = Struct.new(
      :total,
      :created,
      :updated,
      :skipped,
      :failed,
      :duration_seconds,
      :throughput,
      :errors,
      keyword_init: true
    )

    def initialize(records:, batch_size: DEFAULT_BATCH_SIZE)
      @records = records
      @batch_size = batch_size.to_i
    end

    def call
      started_at = monotonic_time

      created = 0
      updated = 0
      skipped = 0
      failed = 0
      errors = []

      records.each_slice(batch_size) do |batch|
        existing_records = Employee.where(employee_code: batch.map { |record| record.fetch(:employee_code) }).index_by(&:employee_code)
        now = Time.current
        rows_for_upsert = []

        batch.each do |record|
          attrs = normalized_attributes(record)
          existing_record = existing_records[attrs.fetch(:employee_code)]

          if existing_record.nil?
            created += 1
            rows_for_upsert << attrs.merge(created_at: now, updated_at: now)
          elsif changed?(existing_record, attrs)
            updated += 1
            rows_for_upsert << attrs.merge(created_at: existing_record.created_at, updated_at: now)
          else
            skipped += 1
          end
        end

        Employee.upsert_all(rows_for_upsert, unique_by: :index_employees_on_employee_code, record_timestamps: false) if rows_for_upsert.any?
      rescue StandardError => error
        failed += batch.size
        errors << error.message
      end

      duration_seconds = monotonic_time - started_at

      Result.new(
        total: records.size,
        created: created,
        updated: updated,
        skipped: skipped,
        failed: failed,
        duration_seconds: duration_seconds.round(3),
        throughput: throughput_for(records.size, duration_seconds),
        errors: errors
      )
    end

    private

    attr_reader :records, :batch_size

    def normalized_attributes(record)
      attributes = record.to_h.symbolize_keys.slice(*UPSERT_ATTRIBUTES)
      attributes[:deleted_at] = nil unless attributes.key?(:deleted_at)
      attributes
    end

    def changed?(existing_record, attrs)
      UPSERT_ATTRIBUTES.any? do |attribute|
        existing_record.public_send(attribute) != attrs[attribute]
      end
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

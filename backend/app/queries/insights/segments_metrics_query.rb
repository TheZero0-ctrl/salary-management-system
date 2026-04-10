# frozen_string_literal: true

module Insights
  class SegmentsMetricsQuery < ApplicationQuery
    def initialize(country_code:, job_title:, relation: Employee.not_deleted)
      @country_code = country_code
      @job_title = job_title
      super(relation)
    end

    def call
      min, max, avg, median, p25, p75, p90, count = scoped_relation.pick(*aggregate_expressions)

      formatted_metrics(min:, max:, avg:, median:, p25:, p75:, p90:, count:)
    end

    private

    attr_reader :country_code, :job_title

    def scoped_relation
      @relation.where(country_code: country_code, job_title: job_title)
    end

    def default_relation
      Employee.not_deleted
    end

    def aggregate_expressions
      @aggregate_expressions ||= [
        Arel.sql("MIN(salary_cents)"),
        Arel.sql("MAX(salary_cents)"),
        Arel.sql("AVG(salary_cents)"),
        Arel.sql("PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary_cents)"),
        Arel.sql("PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY salary_cents)"),
        Arel.sql("PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY salary_cents)"),
        Arel.sql("PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY salary_cents)"),
        Arel.sql("COUNT(*)")
      ]
    end

    def formatted_metrics(min:, max:, avg:, median:, p25:, p75:, p90:, count:)
      {
        min: min,
        max: max,
        avg: avg&.to_f,
        median: median&.to_f,
        p25: p25&.to_f,
        p75: p75&.to_f,
        p90: p90&.to_f,
        count: count
      }
    end
  end
end

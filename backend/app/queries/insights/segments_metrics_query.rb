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
        min: MoneyAmount.cents_to_dollars(min),
        max: MoneyAmount.cents_to_dollars(max),
        avg: MoneyAmount.cents_to_dollars(avg),
        median: MoneyAmount.cents_to_dollars(median),
        p25: MoneyAmount.cents_to_dollars(p25),
        p75: MoneyAmount.cents_to_dollars(p75),
        p90: MoneyAmount.cents_to_dollars(p90),
        count: count
      }
    end
  end
end

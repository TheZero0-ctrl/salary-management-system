# frozen_string_literal: true

module Insights
  class CountriesMetricsQuery < ApplicationQuery
    def initialize(country_code:, relation: Employee.not_deleted)
      @country_code = country_code
      super(relation)
    end

    def call
      min, max, avg, median, stddev, count = @relation.where(country_code: country_code).pick(
        Arel.sql("MIN(salary_cents)"),
        Arel.sql("MAX(salary_cents)"),
        Arel.sql("AVG(salary_cents)"),
        Arel.sql("PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary_cents)"),
        Arel.sql("STDDEV_POP(salary_cents)"),
        Arel.sql("COUNT(*)")
      )

      {
        min: MoneyAmount.cents_to_dollars(min),
        max: MoneyAmount.cents_to_dollars(max),
        avg: MoneyAmount.cents_to_dollars(avg),
        median: MoneyAmount.cents_to_dollars(median),
        stddev: MoneyAmount.cents_to_dollars(stddev),
        count: count
      }
    end

    private

    attr_reader :country_code

    def default_relation
      Employee.not_deleted
    end
  end
end

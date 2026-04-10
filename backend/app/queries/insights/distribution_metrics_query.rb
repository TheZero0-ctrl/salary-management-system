# frozen_string_literal: true

module Insights
  class DistributionMetricsQuery < ApplicationQuery
    DEFAULT_BUCKET_SIZE = 100_000

    def initialize(country_code: nil, job_title: nil, bucket_size: DEFAULT_BUCKET_SIZE, relation: Employee.not_deleted)
      @country_code = country_code
      @job_title = job_title
      @bucket_size = [ bucket_size.to_i, 1 ].max
      super(relation)
    end

    def call
      scoped = scoped_relation
      averages = average_salary_by_country(scoped)

      {
        bucket_size: MoneyAmount.cents_to_dollars(bucket_size),
        buckets: salary_buckets(scoped),
        top_countries: averages.sort_by { |entry| -entry.fetch(:avg_salary) }.first(3),
        bottom_countries: averages.first(3)
      }
    end

    private

    attr_reader :country_code, :job_title, :bucket_size

    def default_relation
      Employee.not_deleted
    end

    def scoped_relation
      scope = @relation
      scope = scope.where(country_code: country_code) if country_code.present?
      scope = scope.where(job_title: job_title) if job_title.present?
      scope
    end

    def salary_buckets(scope)
      grouped = scope.group(Arel.sql("FLOOR(salary_cents / #{bucket_size})")).count

      grouped.sort_by { |bucket_index, _| bucket_index }.map do |bucket_index, count|
        lower_bound = bucket_index * bucket_size

        {
          min_salary: MoneyAmount.cents_to_dollars(lower_bound),
          max_salary: MoneyAmount.cents_to_dollars(lower_bound + bucket_size - 1),
          count: count
        }
      end
    end

    def average_salary_by_country(scope)
      scope.group(:country_code)
           .average(:salary_cents)
           .sort_by { |_, avg| avg.to_f }
            .map do |country, avg|
              {
                country_code: country,
                avg_salary: MoneyAmount.cents_to_dollars(avg)
              }
            end
    end
  end
end

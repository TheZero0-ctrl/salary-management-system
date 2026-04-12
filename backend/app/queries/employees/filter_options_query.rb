# frozen_string_literal: true

module Employees
  class FilterOptionsQuery < ApplicationQuery
    def call
      {
        country_codes: distinct_values_for(:country_code),
        job_titles: distinct_values_for(:job_title),
        departments: distinct_values_for(:department)
      }
    end

    private

    def default_relation
      Employee.not_deleted
    end

    def distinct_values_for(field)
      @relation.where.not(field => nil)
               .where.not(field => "")
               .distinct
               .order(field)
               .pluck(field)
    end
  end
end

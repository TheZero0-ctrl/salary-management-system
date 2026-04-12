# frozen_string_literal: true

module Employees
  class FilterQuery < ApplicationQuery
    SORT_FIELDS = {
      "id" => :id,
      "full_name" => :full_name,
      "employee_code" => :employee_code,
      "country_code" => :country_code,
      "job_title" => :job_title,
      "department" => :department,
      "status" => :status,
      "salary" => :salary_cents,
      "salary_cents" => :salary_cents,
      "updated_at" => :updated_at
    }.freeze
    SORT_DIRECTIONS = %w[asc desc].freeze

    def self.call(params = {})
      new(nil, params).call
    end

    def initialize(relation = nil, params = {})
      super(relation)
      @params = params.to_h.with_indifferent_access
    end

    def call
      result = @relation
      result = apply_filters(result)
      result = apply_term_filter(result)
      apply_sort(result)
    end

    private

    def default_relation
      Employee.not_deleted
    end

    def apply_filters(scope)
      scope = apply_case_insensitive_exact_filter(scope, :country_code) if @params[:country_code].present?
      scope = apply_case_insensitive_exact_filter(scope, :job_title) if @params[:job_title].present?
      scope = apply_case_insensitive_exact_filter(scope, :department) if @params[:department].present?
      scope = apply_case_insensitive_exact_filter(scope, :status) if @params[:status].present?
      scope = scope.where("employees.salary_cents >= ?", @params[:salary_min]) if @params[:salary_min].present?
      scope = scope.where("employees.salary_cents <= ?", @params[:salary_max]) if @params[:salary_max].present?
      scope
    end

    def apply_case_insensitive_exact_filter(scope, field)
      value = @params[field].to_s.strip.downcase
      column = Employee.arel_table[field]
      scope.where(column.lower.eq(value))
    end

    def apply_term_filter(scope)
      search = @params[:search]
      return scope if search.blank?

      search_term = "%#{Employee.sanitize_sql_like(search.to_s.strip)}%"
      scope.where(
        "employees.full_name ILIKE :term OR employees.employee_code ILIKE :term",
        term: search_term
      )
    end

    def apply_sort(scope)
      column = SORT_FIELDS[@params[:sort_by].to_s]
      return scope.order(id: :asc) if column.blank?

      direction = @params[:sort_direction].to_s.downcase
      direction = "asc" unless SORT_DIRECTIONS.include?(direction)

      scope.order(column => direction.to_sym).order(id: :asc)
    end
  end
end

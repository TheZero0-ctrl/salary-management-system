# frozen_string_literal: true

module Employees
  class DatasetGenerator < ApplicationService
    DEFAULT_COUNT = 10_000
    DEFAULT_SEED = 42

    FIRST_NAMES_PATH = Rails.root.join("db", "seeds", "first_names.txt")
    LAST_NAMES_PATH = Rails.root.join("db", "seeds", "last_names.txt")

    JOB_TITLES = [
      "Software Engineer",
      "Senior Software Engineer",
      "Product Manager",
      "Senior Product Manager",
      "Data Analyst",
      "Data Scientist",
      "HR Specialist",
      "HR Manager",
      "Finance Analyst",
      "Operations Manager",
      "QA Engineer",
      "Engineering Manager",
      "UX Designer",
      "Sales Executive",
      "Marketing Specialist"
    ].freeze

    DEPARTMENTS = [
      "Engineering",
      "Product",
      "Data",
      "Human Resources",
      "Finance",
      "Operations",
      "Sales",
      "Marketing"
    ].freeze

    COUNTRY_CODES = %w[US IN GB DE CA AU SG BR FR NL].freeze

    EMPLOYMENT_TYPES = Employee.employment_types.keys.freeze
    STATUSES = Employee.statuses.keys.freeze

    def initialize(count: DEFAULT_COUNT, seed: DEFAULT_SEED, reference_date: Date.current)
      @count = count.to_i
      @random = Random.new(seed)
      @reference_date = reference_date
      @first_names = load_names(FIRST_NAMES_PATH)
      @last_names = load_names(LAST_NAMES_PATH)
    end

    def call
      (1..count).map { |index| build_employee(index) }
    end

    private

    attr_reader :count, :random, :reference_date, :first_names, :last_names

    def build_employee(index)
      hire_date = reference_date - random.rand(365..(365 * 12))
      effective_from = [ hire_date + random.rand(0..730), reference_date ].min

      {
        employee_code: format("EMP-%04d", index),
        full_name: "#{sample(first_names)} #{sample(last_names)}",
        job_title: sample(JOB_TITLES),
        country_code: sample(COUNTRY_CODES),
        salary_cents: random.rand(4_500_000..32_000_000),
        employment_type: sample(EMPLOYMENT_TYPES),
        effective_from: effective_from,
        status: sample(STATUSES),
        department: sample(DEPARTMENTS),
        hire_date: hire_date,
        last_salary_review_date: hire_date + random.rand(30..[ (reference_date - hire_date).to_i, 30 ].max),
        deleted_at: nil
      }
    end

    def sample(values)
      values[random.rand(values.length)]
    end

    def load_names(path)
      names = File.readlines(path, chomp: true).map(&:strip).reject(&:empty?).uniq
      raise ArgumentError, "Name list is empty: #{path}" if names.empty?

      names
    end
  end
end

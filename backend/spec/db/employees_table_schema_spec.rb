require "rails_helper"

RSpec.describe "employees table schema" do
  let(:connection) { ActiveRecord::Base.connection }
  let(:employee_column_names) do
    next [] unless connection.table_exists?(:employees)

    connection.columns(:employees).map(&:name)
  end
  let(:employee_indexes) do
    next [] unless connection.table_exists?(:employees)

    connection.indexes(:employees)
  end

  def index_with_columns(columns)
    employee_indexes.find { |index| index.columns == columns }
  end

  it "creates the employees table" do
    expect(connection.table_exists?(:employees)).to be(true)
  end

  %w[
    employee_code
    full_name
    job_title
    department
    country_code
    salary_cents
    employment_type
    status
    effective_from
    hire_date
    last_salary_review_date
    deleted_at
    created_at
    updated_at
  ].each do |column_name|
    it "includes #{column_name}" do
      expect(employee_column_names).to include(column_name)
    end
  end

  it "has a unique index on employee_code" do
    index = index_with_columns([ "employee_code" ])

    expect(index).to be_present
    expect(index.unique).to be(true)
  end

  it "has an index on country_code" do
    expect(index_with_columns([ "country_code" ])).to be_present
  end

  it "has an index on job_title" do
    expect(index_with_columns([ "job_title" ])).to be_present
  end

  it "has an index on status" do
    expect(index_with_columns([ "status" ])).to be_present
  end

  it "has a composite index on country_code and job_title" do
    expect(index_with_columns([ "country_code", "job_title" ])).to be_present
  end

  it "has a composite index on country_code and salary_cents" do
    expect(index_with_columns([ "country_code", "salary_cents" ])).to be_present
  end

  it "has an index on deleted_at" do
    expect(index_with_columns([ "deleted_at" ])).to be_present
  end
end

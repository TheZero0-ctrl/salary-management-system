require "rails_helper"

RSpec.describe "employees table schema" do
  let(:connection) { ActiveRecord::Base.connection }
  let(:employee_column_names) do
    next [] unless connection.table_exists?(:employees)

    connection.columns(:employees).map(&:name)
  end

  it "creates the employees table" do
    expect(connection.table_exists?(:employees)).to be(true)
  end

  it "includes employee_code" do
    expect(employee_column_names).to include("employee_code")
  end

  it "includes full_name" do
    expect(employee_column_names).to include("full_name")
  end

  it "includes job_title" do
    expect(employee_column_names).to include("job_title")
  end

  it "includes department" do
    expect(employee_column_names).to include("department")
  end

  it "includes country_code" do
    expect(employee_column_names).to include("country_code")
  end

  it "includes currency_code" do
    expect(employee_column_names).to include("currency_code")
  end

  it "includes salary_amount" do
    expect(employee_column_names).to include("salary_amount")
  end

  it "includes employment_type" do
    expect(employee_column_names).to include("employment_type")
  end

  it "includes status" do
    expect(employee_column_names).to include("status")
  end

  it "includes effective_from" do
    expect(employee_column_names).to include("effective_from")
  end

  it "includes hire_date" do
    expect(employee_column_names).to include("hire_date")
  end

  it "includes last_salary_review_date" do
    expect(employee_column_names).to include("last_salary_review_date")
  end

  it "includes deleted_at" do
    expect(employee_column_names).to include("deleted_at")
  end

  it "includes created_at" do
    expect(employee_column_names).to include("created_at")
  end

  it "includes updated_at" do
    expect(employee_column_names).to include("updated_at")
  end
end

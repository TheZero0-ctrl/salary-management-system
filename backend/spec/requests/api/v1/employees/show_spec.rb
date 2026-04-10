# frozen_string_literal: true

require "rails_helper"

RSpec.describe "GET /api/v1/employees/:employee_code", type: :request do
  SHOW_STABLE_EMPLOYEE_FIELDS = %w[
    id
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
  ].freeze

  def json_response
    JSON.parse(response.body)
  end

  it "returns one employee with the same stable response shape" do
    employee = create(:employee)

    get "/api/v1/employees/#{employee.employee_code}"

    expect(response).to have_http_status(:ok)
    expect(json_response.fetch("data")).to include(
      "id" => employee.id,
      "employee_code" => employee.employee_code
    )
    expect(json_response.fetch("data").keys).to include(*SHOW_STABLE_EMPLOYEE_FIELDS)
  end

  it "returns 404 for an unknown employee code" do
    get "/api/v1/employees/EMP-999999"

    expect(response).to have_http_status(:not_found)
  end

  it "returns 404 for a soft-deleted employee" do
    employee = create(:employee, deleted_at: 1.day.ago)

    get "/api/v1/employees/#{employee.employee_code}"

    expect(response).to have_http_status(:not_found)
  end

  it "returns 403 when show policy denies access" do
    employee = create(:employee)

    allow_any_instance_of(EmployeePolicy).to receive(:show?).and_return(false)

    get "/api/v1/employees/#{employee.employee_code}"

    expect(response).to have_http_status(:forbidden)
  end
end

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

  def authorization_header(role)
    email = "#{role}-#{SecureRandom.hex(4)}@example.com"
    password = "password123"

    user = create(:user, role: role, email_address: email, password: password)
    auth_headers_for(user, password: password)
  end

  it "returns 401 when unauthenticated" do
    employee = create(:employee)

    get "/api/v1/employees/#{employee.employee_code}"

    expect_error_envelope(status: :unauthorized, code: "UNAUTHENTICATED", message: "Unauthorized")
  end

  it "returns 401 for an invalid token" do
    employee = create(:employee)

    get "/api/v1/employees/#{employee.employee_code}", headers: { "Authorization" => "Bearer invalid.token" }

    expect_error_envelope(status: :unauthorized, code: "UNAUTHENTICATED", message: "Unauthorized")
  end

  it "returns 403 for an authenticated non-hr-manager" do
    employee = create(:employee)

    get "/api/v1/employees/#{employee.employee_code}", headers: authorization_header("employee")

    expect_error_envelope(status: :forbidden, code: "FORBIDDEN", message: "You are not allowed to perform this action")
  end

  context "when authenticated as hr_manager" do
    let(:headers) { authorization_header("hr_manager") }

    it "returns one employee with the same stable response shape" do
      employee = create(:employee)

      get "/api/v1/employees/#{employee.employee_code}", headers: headers

      expect(response).to have_http_status(:ok)
      expect(json_response.fetch("data")).to include(
        "id" => employee.id,
        "employee_code" => employee.employee_code
      )
      expect(json_response.fetch("data").keys).to include(*SHOW_STABLE_EMPLOYEE_FIELDS)
    end

    it "returns 404 for an unknown employee code" do
      get "/api/v1/employees/EMP-999999", headers: headers

      expect_error_envelope(status: :not_found, code: "NOT_FOUND", message: "Resource not found")
    end

    it "returns 404 for a soft-deleted employee" do
      employee = create(:employee, deleted_at: 1.day.ago)

      get "/api/v1/employees/#{employee.employee_code}", headers: headers

      expect_error_envelope(status: :not_found, code: "NOT_FOUND", message: "Resource not found")
    end
  end
end

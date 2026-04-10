# frozen_string_literal: true

require "rails_helper"

RSpec.describe "PATCH /api/v1/employees/:employee_code", type: :request do
  UPDATE_STABLE_EMPLOYEE_FIELDS = %w[
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

  def patch_update(employee_code:, params:, headers: nil)
    patch "/api/v1/employees/#{employee_code}", params: { employee: params }, headers:
  end

  it "returns 401 when unauthenticated" do
    employee = create(:employee)

    patch_update(employee_code: employee.employee_code, params: { full_name: "Updated Name" })

    expect_error_envelope(status: :unauthorized, code: "UNAUTHENTICATED", message: "Unauthorized")
  end

  it "returns 403 for an authenticated non-hr-manager" do
    employee = create(:employee)

    patch_update(
      employee_code: employee.employee_code,
      params: { full_name: "Updated Name" },
      headers: authorization_header("employee")
    )

    expect_error_envelope(status: :forbidden, code: "FORBIDDEN", message: "You are not allowed to perform this action")
  end

  context "when authenticated as hr_manager" do
    let(:headers) { authorization_header("hr_manager") }

    it "returns 400 when employee payload is not nested" do
      employee = create(:employee, full_name: "Original Name")

      patch "/api/v1/employees/#{employee.employee_code}", params: { full_name: "Updated Name" }, headers: headers

      expect_error_envelope(status: :bad_request, code: "BAD_REQUEST", message: "Invalid query parameter")
      expect(json_response.fetch("error").fetch("details")).to include(
        include("field" => "employee", "message" => "is required")
      )
    end

    it "updates the employee and returns 200 with updated fields" do
      employee = create(:employee, employee_code: "EMP-1001", full_name: "Original Name", salary_cents: 120_000)
      params = {
        employee_code: "EMP-2001",
        full_name: "Updated Name",
        salary_cents: 150_000,
        job_title: "Senior Engineer"
      }

      patch_update(employee_code: employee.employee_code, params: params, headers: headers)

      expect(response).to have_http_status(:ok)

      employee.reload

      expect(employee).to have_attributes(
        employee_code: "EMP-2001",
        full_name: "Updated Name",
        salary_cents: 150_000,
        job_title: "Senior Engineer"
      )
      expect(json_response.fetch("data")).to include(
        "id" => employee.id,
        "employee_code" => "EMP-2001",
        "full_name" => "Updated Name",
        "salary_cents" => 150_000,
        "job_title" => "Senior Engineer"
      )
      expect(json_response.fetch("data").keys).to include(*UPDATE_STABLE_EMPLOYEE_FIELDS)
    end

    it "returns 422 for invalid params and does not persist invalid changes" do
      employee = create(:employee, full_name: "Original Name")

      patch_update(
        employee_code: employee.employee_code,
        params: { full_name: "" },
        headers: headers
      )

      expect_error_envelope(status: :unprocessable_content, code: "VALIDATION_ERROR", message: "Validation failed")
      expect(employee.reload.full_name).to eq("Original Name")
    end

    it "returns 409 for duplicate employee_code update" do
      employee = create(:employee, employee_code: "EMP-1001")
      create(:employee, employee_code: "EMP-1002")

      patch_update(
        employee_code: employee.employee_code,
        params: { employee_code: "EMP-1002" },
        headers: headers
      )

      expect_error_envelope(status: :conflict, code: "DUPLICATE_EMPLOYEE_CODE", message: "Employee code has already been taken")
      expect(employee.reload.employee_code).to eq("EMP-1001")
    end

    it "returns 404 for an unknown employee code" do
      patch_update(
        employee_code: "EMP-999999",
        params: { full_name: "Updated Name" },
        headers: headers
      )

      expect_error_envelope(status: :not_found, code: "EMPLOYEE_NOT_FOUND", message: "Employee not found")
    end
  end
end

# frozen_string_literal: true

require "rails_helper"

RSpec.describe "POST /api/v1/employees", type: :request do
  EMPLOYEES_ENDPOINT = "/api/v1/employees"

  CREATE_STABLE_EMPLOYEE_FIELDS = %w[
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

  def valid_params
    {
      employee_code: "EMP-9001",
      full_name: "Ada Lovelace",
      job_title: "Engineering Manager",
      country_code: "US",
      salary_cents: 250_000,
      employment_type: "full_time",
      effective_from: Date.new(2026, 1, 1),
      status: "active",
      department: "Engineering",
      hire_date: Date.new(2025, 12, 1),
      last_salary_review_date: Date.new(2025, 12, 15)
    }
  end

  def post_create(params:, headers: nil)
    post EMPLOYEES_ENDPOINT, params:, headers:
  end

  it "returns 401 when unauthenticated" do
    post_create(params: valid_params)

    expect(response).to have_http_status(:unauthorized)
    expect(json_response).to include("error" => "Unauthorized")
  end

  it "returns 403 for an authenticated non-hr-manager" do
    post_create(params: valid_params, headers: authorization_header("employee"))

    expect(response).to have_http_status(:forbidden)
    expect(json_response).to include("error" => "You are not allowed to perform this action")
  end

  context "when authenticated as hr_manager" do
    let(:headers) { authorization_header("hr_manager") }

    it "returns 201, persists the employee, and returns expected fields" do
      expect do
        post_create(params: valid_params, headers: headers)
      end.to change(Employee, :count).by(1)

      created_employee = Employee.find_by!(employee_code: "EMP-9001")

      expect(response).to have_http_status(:created)
      expect(json_response.fetch("data")).to include(
        "id" => created_employee.id,
        "employee_code" => "EMP-9001",
        "full_name" => "Ada Lovelace",
        "job_title" => "Engineering Manager",
        "country_code" => "US",
        "salary_cents" => 250_000,
        "employment_type" => "full_time",
        "effective_from" => "2026-01-01",
        "status" => "active",
        "department" => "Engineering",
        "hire_date" => "2025-12-01",
        "last_salary_review_date" => "2025-12-15"
      )
      expect(json_response.fetch("data").keys).to include(*CREATE_STABLE_EMPLOYEE_FIELDS)
    end

    it "returns 422 for invalid params and does not create an employee" do
      invalid_params = valid_params.merge(full_name: "")

      expect do
        post_create(params: invalid_params, headers: headers)
      end.not_to change(Employee, :count)

      expect(response).to have_http_status(422)
      expect(json_response).to include("error")
    end

    it "returns 409 for duplicate employee_code and does not create an employee" do
      create(:employee, employee_code: "EMP-9001")

      expect do
        post_create(params: valid_params, headers: headers)
      end.not_to change(Employee, :count)

      expect(response).to have_http_status(:conflict)
      expect(json_response).to include("error")
    end
  end
end

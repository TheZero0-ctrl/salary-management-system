# frozen_string_literal: true

require "rails_helper"

RSpec.describe "GET /api/v1/employees", type: :request do
  INDEX_STABLE_EMPLOYEE_FIELDS = %w[
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
    get "/api/v1/employees"

    expect(response).to have_http_status(:unauthorized)
    expect(json_response).to include("error" => "Unauthorized")
  end

  it "returns 401 for an invalid token" do
    get "/api/v1/employees", headers: { "Authorization" => "Bearer invalid.token" }

    expect(response).to have_http_status(:unauthorized)
    expect(json_response).to include("error" => "Unauthorized")
  end

  it "returns 403 for an authenticated non-hr-manager" do
    get "/api/v1/employees", headers: authorization_header("employee")

    expect(response).to have_http_status(:forbidden)
    expect(json_response).to include("error" => "You are not allowed to perform this action")
  end

  context "when authenticated as hr_manager" do
    let(:headers) { authorization_header("hr_manager") }

    it "returns paginated employees with pagination meta" do
      create_list(:employee, 20)

      get "/api/v1/employees", params: { page: 2, per_page: 2 }, headers: headers

      expect(response).to have_http_status(:ok)
      expect(json_response).to include("data", "meta")
      expect(json_response.fetch("meta")).to include(
        "per_page" => 2,
        "page" => 2
      )
      expect(json_response.fetch("data").length).to eq(2)
    end

    it "returns deterministic order for sort ties using id asc as tiebreaker" do
      first = create(:employee, salary_cents: 500_000)
      second = create(:employee, salary_cents: 500_000)
      last = create(:employee, salary_cents: 100_000)

      get "/api/v1/employees", params: { sort_by: "salary_cents", sort_direction: "desc" }, headers: headers

      expect(response).to have_http_status(:ok)

      returned_ids = json_response.fetch("data").map { |item| item.fetch("id") }

      expect(returned_ids).to eq([ first.id, second.id, last.id ])
    end

    it "returns a stable employee response shape" do
      create(:employee)

      get "/api/v1/employees", headers: headers

      expect(response).to have_http_status(:ok)

      employee_data = json_response.fetch("data").first

      expect(employee_data.keys).to include(*INDEX_STABLE_EMPLOYEE_FIELDS)
    end

    it "excludes soft-deleted employees from the listing" do
      visible_employee = create(:employee, deleted_at: nil)
      deleted_employee = create(:employee, deleted_at: 1.day.ago)

      get "/api/v1/employees", headers: headers

      expect(response).to have_http_status(:ok)

      returned_ids = json_response.fetch("data").map { |item| item.fetch("id") }

      expect(returned_ids).to include(visible_employee.id)
      expect(returned_ids).not_to include(deleted_employee.id)
    end

    it "filters employees by country_code" do
      us_employee = create(:employee, country_code: "US", deleted_at: nil)
      create(:employee, country_code: "IN", deleted_at: nil)

      get "/api/v1/employees", params: { country_code: "US" }, headers: headers

      expect(response).to have_http_status(:ok)

      data = json_response.fetch("data")

      expect(data.length).to eq(1)
      expect(data.first).to include(
        "id" => us_employee.id,
        "employee_code" => us_employee.employee_code
      )
    end
  end
end

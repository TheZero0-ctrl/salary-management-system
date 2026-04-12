# frozen_string_literal: true

require "rails_helper"

RSpec.describe "GET /api/v1/employees/filter_options", type: :request do
  FILTER_OPTIONS_ENDPOINT = "/api/v1/employees/filter_options"

  def authorization_header(role)
    email = "#{role}-#{SecureRandom.hex(4)}@example.com"
    password = "password123"

    user = create(:user, role: role, email_address: email, password: password)
    auth_headers_for(user, password: password)
  end

  it "returns 401 when unauthenticated" do
    get FILTER_OPTIONS_ENDPOINT

    expect_error_envelope(status: :unauthorized, code: "UNAUTHENTICATED", message: "Unauthorized")
  end

  it "returns 403 for an authenticated non-hr-manager" do
    get FILTER_OPTIONS_ENDPOINT, headers: authorization_header("employee")

    expect_error_envelope(status: :forbidden, code: "FORBIDDEN", message: "You are not allowed to perform this action")
  end

  it "returns sorted distinct options for hr_manager and excludes soft-deleted employees" do
    headers = authorization_header("hr_manager")

    create(:employee, country_code: "US", job_title: "Software Engineer", department: "Engineering", deleted_at: nil)
    create(:employee, country_code: "IN", job_title: "Data Analyst", department: "Finance", deleted_at: nil)
    create(:employee, country_code: "US", job_title: "Software Engineer", department: "Engineering", deleted_at: nil)
    create(:employee, country_code: "DE", job_title: "Staff Engineer", department: "Platform", deleted_at: 1.day.ago)

    get FILTER_OPTIONS_ENDPOINT, headers: headers

    expect(response).to have_http_status(:ok)

    expect(json_response).to include(
      "data" => {
        "country_codes" => %w[IN US],
        "job_titles" => [ "Data Analyst", "Software Engineer" ],
        "departments" => [ "Engineering", "Finance" ]
      }
    )
  end
end

# frozen_string_literal: true

require "rails_helper"

RSpec.describe "GET /api/v1/insights/distributions", type: :request do
  INSIGHTS_DISTRIBUTIONS_ENDPOINT = "/api/v1/insights/distributions"

  def authorization_header(role)
    email = "#{role}-#{SecureRandom.hex(4)}@example.com"
    password = "password123"

    user = create(:user, role: role, email_address: email, password: password)
    auth_headers_for(user, password: password)
  end

  it "returns 401 when unauthenticated" do
    get INSIGHTS_DISTRIBUTIONS_ENDPOINT

    expect_error_envelope(status: :unauthorized, code: "UNAUTHENTICATED", message: "Unauthorized")
  end

  it "returns 403 for an authenticated non-hr-manager" do
    get INSIGHTS_DISTRIBUTIONS_ENDPOINT, headers: authorization_header("employee")

    expect_error_envelope(status: :forbidden, code: "FORBIDDEN", message: "You are not allowed to perform this action")
  end

  it "returns 422 for invalid country_code format" do
    get INSIGHTS_DISTRIBUTIONS_ENDPOINT,
        params: { country_code: "usa" },
        headers: authorization_header("hr_manager")

    expect_error_envelope(status: :unprocessable_content, code: "VALIDATION_ERROR", message: "Validation failed")
    expect(json_response.fetch("error").fetch("details")).to include(
      include("field" => "country_code", "message" => "must be a valid ISO alpha-2 code")
    )
  end

  it "returns 400 for invalid bucket_size" do
    get INSIGHTS_DISTRIBUTIONS_ENDPOINT,
        params: { bucket_size: "0" },
        headers: authorization_header("hr_manager")

    expect_error_envelope(status: :bad_request, code: "BAD_REQUEST", message: "Invalid query parameter")
    expect(json_response.fetch("error").fetch("details")).to include(
      include("field" => "bucket_size", "message" => "must be greater than or equal to 1")
    )
  end

  context "when authenticated as hr_manager" do
    let(:headers) { authorization_header("hr_manager") }

    it "returns configurable salary buckets and cross-country bands" do
      create(:employee, country_code: "US", salary_cents: 100_000, deleted_at: nil)
      create(:employee, country_code: "US", salary_cents: 220_000, deleted_at: nil)
      create(:employee, country_code: "IN", salary_cents: 80_000, deleted_at: nil)
      create(:employee, country_code: "IN", salary_cents: 90_000, deleted_at: nil)
      create(:employee, country_code: "DE", salary_cents: 400_000, deleted_at: nil)
      create(:employee, country_code: "DE", salary_cents: 999_999, deleted_at: 1.day.ago)

      get INSIGHTS_DISTRIBUTIONS_ENDPOINT, params: { bucket_size: 100_000 }, headers: headers

      expect(response).to have_http_status(:ok)

      data = json_response.fetch("data")
      expect(data).to include("bucket_size" => 100_000)
      expect(data.fetch("buckets")).to include(
        include("min_salary_cents" => 0, "max_salary_cents" => 99_999, "count" => 2),
        include("min_salary_cents" => 100_000, "max_salary_cents" => 199_999, "count" => 1),
        include("min_salary_cents" => 200_000, "max_salary_cents" => 299_999, "count" => 1),
        include("min_salary_cents" => 400_000, "max_salary_cents" => 499_999, "count" => 1)
      )
      expect(data.fetch("top_countries").first).to include("country_code" => "DE")
      expect(data.fetch("bottom_countries").first).to include("country_code" => "IN")
      expect(data.fetch("computed_at")).to be_present
    end
  end
end

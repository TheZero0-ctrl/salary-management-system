# frozen_string_literal: true

require "rails_helper"

RSpec.describe "GET /api/v1/insights/countries", type: :request do
  INSIGHTS_COUNTRIES_ENDPOINT = "/api/v1/insights/countries"

  def authorization_header(role)
    email = "#{role}-#{SecureRandom.hex(4)}@example.com"
    password = "password123"

    user = create(:user, role: role, email_address: email, password: password)
    auth_headers_for(user, password: password)
  end

  def get_countries_insights(country_code:, headers: nil)
    get INSIGHTS_COUNTRIES_ENDPOINT, params: { country_code: country_code }, headers: headers
  end

  it "returns 401 when unauthenticated" do
    get_countries_insights(country_code: "US")

    expect_error_envelope(status: :unauthorized, code: "UNAUTHENTICATED", message: "Unauthorized")
  end

  it "returns 403 for an authenticated non-hr-manager" do
    get_countries_insights(country_code: "US", headers: authorization_header("employee"))

    expect_error_envelope(status: :forbidden, code: "FORBIDDEN", message: "You are not allowed to perform this action")
  end

  it "returns 422 for missing country_code" do
    get INSIGHTS_COUNTRIES_ENDPOINT, headers: authorization_header("hr_manager")

    expect_error_envelope(status: :unprocessable_content, code: "VALIDATION_ERROR", message: "Validation failed")
    expect(json_response.fetch("error").fetch("details")).to include(
      include("field" => "country_code", "message" => "must be a valid ISO alpha-2 code")
    )
  end

  it "returns 422 for invalid country_code format" do
    get_countries_insights(country_code: "usa", headers: authorization_header("hr_manager"))

    expect_error_envelope(status: :unprocessable_content, code: "VALIDATION_ERROR", message: "Validation failed")
    expect(json_response.fetch("error").fetch("details")).to include(
      include("field" => "country_code", "message" => "must be a valid ISO alpha-2 code")
    )
  end

  context "when authenticated as hr_manager" do
    let(:headers) { authorization_header("hr_manager") }

    it "returns salary insights for non-deleted employees in the requested country" do
      create(:employee, country_code: "US", salary_cents: 100_000, deleted_at: nil)
      create(:employee, country_code: "US", salary_cents: 250_000, deleted_at: nil)
      create(:employee, country_code: "US", salary_cents: 500_000, deleted_at: nil)
      create(:employee, country_code: "US", salary_cents: 999_999, deleted_at: 1.day.ago)
      create(:employee, country_code: "IN", salary_cents: 50_000, deleted_at: nil)

      get_countries_insights(country_code: "US", headers: headers)

      expect(response).to have_http_status(:ok)
      expect(json_response).to include("data")

      data = json_response.fetch("data")

      expect(data.keys).to include("min", "max", "avg", "median", "stddev", "count", "computed_at")
      expect(data).to include(
        "min" => 1000.0,
        "max" => 5000.0,
        "count" => 3
      )
      expect(data.fetch("avg")).to be_a(Float)
      expect(data.fetch("median")).to be_a(Float)
      expect(data.fetch("stddev")).to be_a(Float)
      expect(data.fetch("computed_at")).to be_present
    end

    it "returns empty aggregates when no matching employees exist" do
      create(:employee, country_code: "IN", salary_cents: 150_000)

      get_countries_insights(country_code: "US", headers: headers)

      expect(response).to have_http_status(:ok)

      data = json_response.fetch("data")
      expect(data).to include(
        "min" => nil,
        "max" => nil,
        "avg" => nil,
        "median" => nil,
        "stddev" => nil,
        "count" => 0
      )
    end
  end
end

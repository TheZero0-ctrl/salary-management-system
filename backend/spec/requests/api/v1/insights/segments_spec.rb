# frozen_string_literal: true

require "rails_helper"

RSpec.describe "GET /api/v1/insights/segments", type: :request do
  INSIGHTS_SEGMENTS_ENDPOINT = "/api/v1/insights/segments"

  def authorization_header(role)
    email = "#{role}-#{SecureRandom.hex(4)}@example.com"
    password = "password123"

    user = create(:user, role: role, email_address: email, password: password)
    auth_headers_for(user, password: password)
  end

  def get_segments_insights(country_code: nil, job_title: nil, headers: nil)
    get INSIGHTS_SEGMENTS_ENDPOINT, params: { country_code: country_code, job_title: job_title }, headers: headers
  end

  it "returns 401 when unauthenticated" do
    get_segments_insights(country_code: "US", job_title: "Software Engineer")

    expect_error_envelope(status: :unauthorized, code: "UNAUTHENTICATED", message: "Unauthorized")
  end

  it "returns 403 for an authenticated non-hr-manager" do
    get_segments_insights(
      country_code: "US",
      job_title: "Software Engineer",
      headers: authorization_header("employee")
    )

    expect_error_envelope(status: :forbidden, code: "FORBIDDEN", message: "You are not allowed to perform this action")
  end

  it "returns 422 for missing country_code" do
    get INSIGHTS_SEGMENTS_ENDPOINT, params: { job_title: "Software Engineer" }, headers: authorization_header("hr_manager")

    expect_error_envelope(status: :unprocessable_content, code: "VALIDATION_ERROR", message: "Validation failed")
    expect(json_response.fetch("error").fetch("details")).to include(
      include("field" => "country_code", "message" => "must be a valid ISO alpha-2 code")
    )
  end

  it "returns 422 for invalid country_code format" do
    get_segments_insights(country_code: "usa", job_title: "Software Engineer", headers: authorization_header("hr_manager"))

    expect_error_envelope(status: :unprocessable_content, code: "VALIDATION_ERROR", message: "Validation failed")
    expect(json_response.fetch("error").fetch("details")).to include(
      include("field" => "country_code", "message" => "must be a valid ISO alpha-2 code")
    )
  end

  it "returns 422 when job_title is missing" do
    get_segments_insights(country_code: "US", headers: authorization_header("hr_manager"))

    expect_error_envelope(status: :unprocessable_content, code: "VALIDATION_ERROR", message: "Validation failed")
    expect(json_response.fetch("error").fetch("details")).to include(
      include("field" => "job_title", "message" => "can't be blank")
    )
  end

  context "when authenticated as hr_manager" do
    let(:headers) { authorization_header("hr_manager") }

    it "returns segment salary insights with percentile metrics" do
      create(:employee, country_code: "US", job_title: "Software Engineer", salary_cents: 100_000, deleted_at: nil)
      create(:employee, country_code: "US", job_title: "Software Engineer", salary_cents: 200_000, deleted_at: nil)
      create(:employee, country_code: "US", job_title: "Software Engineer", salary_cents: 300_000, deleted_at: nil)
      create(:employee, country_code: "US", job_title: "Software Engineer", salary_cents: 400_000, deleted_at: nil)
      create(:employee, country_code: "US", job_title: "Software Engineer", salary_cents: 500_000, deleted_at: nil)

      get_segments_insights(country_code: "US", job_title: "Software Engineer", headers: headers)

      expect(response).to have_http_status(:ok)

      data = json_response.fetch("data")
      expect(data.keys).to include("min", "max", "avg", "median", "p25", "p75", "p90", "count", "computed_at")
      expect(data).to include(
        "min" => 100_000,
        "max" => 500_000,
        "count" => 5
      )
      expect(data.fetch("avg")).to be_a(Float)
      expect(data.fetch("median")).to be_a(Float)
      expect(data.fetch("p25")).to be_a(Float)
      expect(data.fetch("p75")).to be_a(Float)
      expect(data.fetch("p90")).to be_a(Float)
      expect(data.fetch("computed_at")).to be_present
    end

    it "only includes non-deleted employees for the exact country and job title" do
      create(:employee, country_code: "US", job_title: "Data Analyst", salary_cents: 100_000, deleted_at: nil)
      create(:employee, country_code: "US", job_title: "Data Analyst", salary_cents: 250_000, deleted_at: nil)
      create(:employee, country_code: "US", job_title: "Data Analyst", salary_cents: 999_999, deleted_at: 1.day.ago)
      create(:employee, country_code: "IN", job_title: "Data Analyst", salary_cents: 50_000, deleted_at: nil)
      create(:employee, country_code: "US", job_title: "Software Engineer", salary_cents: 75_000, deleted_at: nil)

      get_segments_insights(country_code: "US", job_title: "Data Analyst", headers: headers)

      expect(response).to have_http_status(:ok)

      data = json_response.fetch("data")
      expect(data).to include(
        "min" => 100_000,
        "max" => 250_000,
        "count" => 2
      )
    end

    it "returns empty aggregates when no matching employees exist" do
      create(:employee, country_code: "IN", job_title: "Data Analyst", salary_cents: 150_000)

      get_segments_insights(country_code: "US", job_title: "Data Analyst", headers: headers)

      expect(response).to have_http_status(:ok)

      data = json_response.fetch("data")
      expect(data).to include(
        "min" => nil,
        "max" => nil,
        "avg" => nil,
        "median" => nil,
        "p25" => nil,
        "p75" => nil,
        "p90" => nil,
        "count" => 0
      )
      expect(data.fetch("computed_at")).to be_present
    end
  end
end

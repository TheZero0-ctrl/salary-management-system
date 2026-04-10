# frozen_string_literal: true

require "rails_helper"

RSpec.describe "POST /api/v1/session", type: :request do
  before do
    Rails.cache.clear
  end

  it "returns 200 with access and refresh tokens for valid credentials" do
    create(:user, :hr_manager, email_address: "hr-manager@example.com", password: "password123")

    post "/api/v1/session", params: {
      email: "hr-manager@example.com",
      password: "password123"
    }

    expect(response).to have_http_status(:ok)
    expect(json_response).to include("access_token", "refresh_token")
    expect(json_response.fetch("access_token")).to be_present
    expect(json_response.fetch("refresh_token")).to be_present
  end

  it "returns 401 for invalid credentials" do
    create(:user, :hr_manager, email_address: "hr-manager@example.com", password: "password123")

    post "/api/v1/session", params: {
      email: "hr-manager@example.com",
      password: "wrong-password"
    }

    expect(response).to have_http_status(:unauthorized)
  end

  it "returns 429 after too many login attempts" do
    create(:user, :hr_manager, email_address: "hr-manager@example.com", password: "password123")

    10.times do
      post "/api/v1/session", params: {
        email: "hr-manager@example.com",
        password: "wrong-password"
      }

      expect(response).to have_http_status(:unauthorized)
    end

    post "/api/v1/session", params: {
      email: "hr-manager@example.com",
      password: "wrong-password"
    }

    expect(response).to have_http_status(:too_many_requests)
    expect(json_response).to include("error" => "Too many login attempts. Try again later.")
  end
end

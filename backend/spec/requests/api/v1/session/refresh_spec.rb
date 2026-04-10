# frozen_string_literal: true

require "rails_helper"

RSpec.describe "POST /api/v1/session/refresh", type: :request do
  before do
    Rails.cache.clear
  end

  it "returns 200 with rotated tokens for a valid refresh token" do
    user = create(:user, :hr_manager, email_address: "hr-manager@example.com", password: "password123")
    tokens = login(email: user.email_address, password: "password123")
    initial_refresh_token = tokens.fetch("refresh_token")
    initial_access_token = tokens.fetch("access_token")

    post "/api/v1/session/refresh",
         params: { refresh_token: initial_refresh_token },
         headers: { "Authorization" => "Bearer #{initial_access_token}" }

    expect(response).to have_http_status(:ok)
    expect(json_response).to include("access_token", "refresh_token")
    expect(json_response.fetch("access_token")).not_to eq(initial_access_token)
    expect(json_response.fetch("refresh_token")).not_to eq(initial_refresh_token)
  end

  it "invalidates the previous access token when refresh receives authorization header" do
    user = create(:user, :hr_manager, email_address: "hr-manager@example.com", password: "password123")
    employee = create(:employee)
    tokens = login(email: user.email_address, password: "password123")
    initial_refresh_token = tokens.fetch("refresh_token")
    initial_access_token = tokens.fetch("access_token")

    post "/api/v1/session/refresh",
         params: { refresh_token: initial_refresh_token },
         headers: { "Authorization" => "Bearer #{initial_access_token}" }

    expect(response).to have_http_status(:ok)

    get "/api/v1/employees/#{employee.employee_code}", headers: { "Authorization" => "Bearer #{initial_access_token}" }

    expect(response).to have_http_status(:unauthorized)
    expect(json_response).to include("error" => "Unauthorized")
  end

  it "returns 401 for a reused refresh token" do
    user = create(:user, :hr_manager, email_address: "hr-manager@example.com", password: "password123")
    initial_refresh_token = refresh_token_for(user, password: "password123")

    post "/api/v1/session/refresh", params: { refresh_token: initial_refresh_token }
    post "/api/v1/session/refresh", params: { refresh_token: initial_refresh_token }

    expect(response).to have_http_status(:unauthorized)
    expect(json_response).to include("error" => "Unauthorized")
  end

  it "returns 401 for an invalid refresh token" do
    post "/api/v1/session/refresh", params: { refresh_token: "invalid-refresh-token" }

    expect(response).to have_http_status(:unauthorized)
    expect(json_response).to include("error" => "Unauthorized")
  end
end

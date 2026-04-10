# frozen_string_literal: true

require "rails_helper"

RSpec.describe "DELETE /api/v1/session", type: :request do
  before do
    Rails.cache.clear
  end

  it "revokes a valid refresh token and returns 204" do
    user = create(:user, :hr_manager, email_address: "hr-manager@example.com", password: "password123")
    tokens = login(email: user.email_address, password: "password123")
    access_token = tokens.fetch("access_token")
    refresh_token = tokens.fetch("refresh_token")

    delete "/api/v1/session",
           params: { refresh_token: refresh_token },
           headers: { "Authorization" => "Bearer #{access_token}" }

    expect(response).to have_http_status(:no_content)

    post "/api/v1/session/refresh", params: { refresh_token: refresh_token }

    expect_error_envelope(status: :unauthorized, code: "UNAUTHENTICATED", message: "Unauthorized")
  end

  it "invalidates the current access token on logout" do
    user = create(:user, :hr_manager, email_address: "hr-manager@example.com", password: "password123")
    employee = create(:employee)
    tokens = login(email: user.email_address, password: "password123")
    access_token = tokens.fetch("access_token")
    refresh_token = tokens.fetch("refresh_token")

    delete "/api/v1/session",
           params: { refresh_token: refresh_token },
           headers: { "Authorization" => "Bearer #{access_token}" }

    expect(response).to have_http_status(:no_content)

    get "/api/v1/employees/#{employee.employee_code}", headers: { "Authorization" => "Bearer #{access_token}" }

    expect_error_envelope(status: :unauthorized, code: "UNAUTHENTICATED", message: "Unauthorized")
  end

  it "returns 401 when authorization header is missing" do
    user = create(:user, :hr_manager, email_address: "hr-manager@example.com", password: "password123")
    refresh_token = refresh_token_for(user, password: "password123")

    delete "/api/v1/session", params: { refresh_token: refresh_token }

    expect_error_envelope(status: :unauthorized, code: "UNAUTHENTICATED", message: "Unauthorized")
  end

  it "returns 401 for an invalid refresh token" do
    delete "/api/v1/session", params: { refresh_token: "invalid-refresh-token" }

    expect_error_envelope(status: :unauthorized, code: "UNAUTHENTICATED", message: "Unauthorized")
  end
end

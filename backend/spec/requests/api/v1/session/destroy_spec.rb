# frozen_string_literal: true

require "rails_helper"

RSpec.describe "DELETE /api/v1/session", type: :request do
  before do
    Rails.cache.clear
  end

  it "revokes a valid refresh token and returns 204" do
    user = create(:user, :hr_manager, email_address: "hr-manager@example.com", password: "password123")
    refresh_token = refresh_token_for(user, password: "password123")

    delete "/api/v1/session", params: { refresh_token: refresh_token }

    expect(response).to have_http_status(:no_content)

    post "/api/v1/session/refresh", params: { refresh_token: refresh_token }

    expect(response).to have_http_status(:unauthorized)
  end

  it "returns 401 for an invalid refresh token" do
    delete "/api/v1/session", params: { refresh_token: "invalid-refresh-token" }

    expect(response).to have_http_status(:unauthorized)
  end
end

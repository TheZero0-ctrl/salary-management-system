# frozen_string_literal: true

module AuthenticationHelpers
  def json_response
    JSON.parse(response.body)
  end

  def login(email:, password:)
    post "/api/v1/session", params: { email: email, password: password }
    json_response
  end

  def access_token_for(user, password:)
    login(email: user.email_address, password: password).fetch("access_token")
  end

  def refresh_token_for(user, password:)
    login(email: user.email_address, password: password).fetch("refresh_token")
  end

  def auth_headers_for(user, password:)
    { "Authorization" => "Bearer #{access_token_for(user, password: password)}" }
  end
end

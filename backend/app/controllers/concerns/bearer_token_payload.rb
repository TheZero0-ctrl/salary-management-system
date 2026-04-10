# frozen_string_literal: true

module BearerTokenPayload
  private

  def bearer_token
    authorization = request.authorization.to_s
    scheme, token = authorization.split(" ", 2)
    return if scheme.to_s.casecmp("Bearer") != 0

    token
  end

  def decoded_bearer_payload
    token = bearer_token
    return if token.blank?

    Warden::JWTAuth::TokenDecoder.new.call(token)
  rescue StandardError
    nil
  end
end

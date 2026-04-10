# frozen_string_literal: true

class RevokedAccessToken < ApplicationRecord
  validates :jti, presence: true, uniqueness: true
  validates :expires_at, presence: true

  scope :active, -> { where("expires_at > ?", Time.current) }

  def self.revoke_payload!(payload)
    jti = payload["jti"].to_s
    exp = payload["exp"].to_i
    return if jti.blank? || exp.zero?

    now = Time.current
    upsert(
      {
        jti: jti,
        expires_at: Time.zone.at(exp),
        created_at: now,
        updated_at: now
      },
      unique_by: :index_revoked_access_tokens_on_jti
    )
  end

  def self.revoked?(jti)
    return false if jti.blank?

    active.exists?(jti: jti)
  end

  def self.jwt_revoked?(payload, _user)
    revoked?(payload["jti"])
  end

  def self.revoke_jwt(payload, _user)
    revoke_payload!(payload)
  end
end

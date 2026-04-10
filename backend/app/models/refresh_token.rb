# frozen_string_literal: true

class RefreshToken < ApplicationRecord
  EXPIRY_DURATION = 30.days

  belongs_to :user

  validates :token_digest, presence: true
  validates :expires_at, presence: true

  scope :active, -> { where(revoked_at: nil).where("expires_at > ?", Time.current) }

  def self.issue_for(user)
    plain_token = SecureRandom.urlsafe_base64(64)

    create!(
      user: user,
      token_digest: digest(plain_token),
      expires_at: EXPIRY_DURATION.from_now
    )

    plain_token
  end

  def self.find_active_by_token(plain_token)
    return if plain_token.blank?

    active.find_by(token_digest: digest(plain_token))
  end

  def revoke!
    update!(revoked_at: Time.current)
  end

  def self.digest(token)
    OpenSSL::Digest::SHA256.hexdigest(token)
  end
end

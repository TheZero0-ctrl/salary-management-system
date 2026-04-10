# frozen_string_literal: true

class User < ApplicationRecord
  devise :database_authenticatable,
         :jwt_authenticatable,
         jwt_revocation_strategy: RevokedAccessToken

  has_many :refresh_tokens, dependent: :destroy

  normalizes :email_address, with: ->(e) { e.strip.downcase }

  enum :role, { hr_manager: "hr_manager", employee: "employee" }

  validates :email_address, presence: true
  validates :role, presence: true, inclusion: { in: roles.keys }

  def jwt_payload
    { "jti" => SecureRandom.uuid }
  end
end

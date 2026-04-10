# frozen_string_literal: true

class User < ApplicationRecord
  devise :database_authenticatable,
         :jwt_authenticatable,
         jwt_revocation_strategy: RevokedAccessToken

  has_many :refresh_tokens, dependent: :destroy

  before_validation :ensure_jti, on: :create

  normalizes :email_address, with: ->(e) { e.strip.downcase }

  enum :role, { hr_manager: "hr_manager", employee: "employee" }

  validates :email_address, presence: true
  validates :jti, presence: true, uniqueness: true
  validates :role, presence: true, inclusion: { in: roles.keys }

  def jwt_payload
    { "jti" => SecureRandom.uuid }
  end

  private

  def ensure_jti
    self.jti = SecureRandom.uuid if jti.blank?
  end
end

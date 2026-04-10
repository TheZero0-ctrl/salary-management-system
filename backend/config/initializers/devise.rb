# frozen_string_literal: true

require "devise/orm/active_record"

Devise.setup do |config|
  config.secret_key = Rails.application.credentials.secret_key_base || Rails.application.secret_key_base
  config.mailer_sender = "please-change-me@example.com"
  config.parent_controller = "ApplicationController"
  config.navigational_formats = []
  config.authentication_keys = [ :email_address ]
  config.jwt do |jwt|
    jwt.secret = Rails.application.secret_key_base
  end
end

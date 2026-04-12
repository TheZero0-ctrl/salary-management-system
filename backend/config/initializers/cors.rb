# Be sure to restart your server when you modify this file.

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  frontend_origins = ENV.fetch("FRONTEND_APP_ORIGINS", "")
    .split(",")
    .map(&:strip)
    .reject(&:empty?)

  frontend_origin = ENV["FRONTEND_APP_ORIGIN"]&.strip
  frontend_origins << frontend_origin if frontend_origin.present?

  default_local_origins = [
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:4000",
    "http://127.0.0.1:4000"
  ]

  allowed_origins = (default_local_origins + frontend_origins).uniq

  allow do
    origins(*allowed_origins)

    resource "/api/*",
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
      expose: [ "Authorization" ]
  end
end

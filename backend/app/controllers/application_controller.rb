class ApplicationController < ActionController::API
  include BearerTokenPayload
  include QueryParamParsing
  include ActionPolicy::Controller
  include Pagy::Method
  include PaginationParams

  before_action :require_authenticated_user
  authorize :user, through: :current_user

  rescue_from ActiveRecord::RecordNotFound do
    render_api_error(:not_found)
  end

  rescue_from QueryParamParsing::InvalidQueryParameter do |error|
    render_api_error(:bad_request, details: [ { field: error.field, message: error.detail } ])
  end

  rescue_from ActionPolicy::Unauthorized do
    render_api_error(:forbidden)
  end

  private

  def require_authenticated_user
    return if user_signed_in?

    render_api_error(:unauthenticated)
  end

  def render_api_error(key, details: [], message: nil)
    definition = ApiErrors.fetch(key)
    render_error(
      definition.fetch(:status),
      message || definition.fetch(:message),
      code: definition.fetch(:code),
      details: details
    )
  end

  def render_error(status, message, code: nil, details: [])
    render json: {
      error: {
        code: code || default_error_code_for(status),
        message: message,
        details: details,
        request_id: request.request_id
      }
    }, status: status
  end

  def default_error_code_for(status)
    case status.to_sym
    when :bad_request then "BAD_REQUEST"
    when :unauthorized then "UNAUTHENTICATED"
    when :forbidden then "FORBIDDEN"
    when :not_found then "NOT_FOUND"
    when :conflict then "CONFLICT"
    when :unprocessable_entity, :unprocessable_content then "VALIDATION_ERROR"
    when :too_many_requests then "RATE_LIMITED"
    else "INTERNAL_ERROR"
    end
  end
end

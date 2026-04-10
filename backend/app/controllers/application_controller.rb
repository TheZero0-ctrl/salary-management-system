class ApplicationController < ActionController::API
  include BearerTokenPayload

  before_action :require_authenticated_user
  include ActionPolicy::Controller
  authorize :user, through: :current_user
  include Pagy::Method
  include PaginationParams

  rescue_from ActiveRecord::RecordNotFound do
    render_error(:not_found, "Resource not found", code: "NOT_FOUND")
  end

  rescue_from ActionPolicy::Unauthorized do
    render_error(:forbidden, "You are not allowed to perform this action", code: "FORBIDDEN")
  end

  private

  def require_authenticated_user
    return if user_signed_in?

    render_error(:unauthorized, "Unauthorized", code: "UNAUTHENTICATED")
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
    when :unprocessable_entity then "VALIDATION_ERROR"
    when :too_many_requests then "RATE_LIMITED"
    else "INTERNAL_ERROR"
    end
  end
end

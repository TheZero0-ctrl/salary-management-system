class ApplicationController < ActionController::API
  include BearerTokenPayload

  before_action :require_authenticated_user
  include ActionPolicy::Controller
  authorize :user, through: :current_user
  include Pagy::Method
  include PaginationParams

  rescue_from ActiveRecord::RecordNotFound do
    render_error(:not_found, "Resource not found")
  end

  rescue_from ActionPolicy::Unauthorized do
    render_error(:forbidden, "You are not allowed to perform this action")
  end

  private

  def require_authenticated_user
    return if user_signed_in?

    render_error(:unauthorized, "Unauthorized")
  end

  def render_error(status, message)
    render json: { error: message }, status: status
  end
end

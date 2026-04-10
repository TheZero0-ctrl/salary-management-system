class ApplicationController < ActionController::API
  before_action :authenticate_user!
  include ActionPolicy::Controller
  authorize :user, through: :current_user
  include Pagy::Method
  include PaginationParams

  rescue_from ActiveRecord::RecordNotFound do
    head :not_found
  end

  rescue_from ActionPolicy::Unauthorized do
    head :forbidden
  end
end

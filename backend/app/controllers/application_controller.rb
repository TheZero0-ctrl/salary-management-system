class ApplicationController < ActionController::API
  include ActionPolicy::Controller
  include Pagy::Method
  include PaginationParams

  rescue_from ActiveRecord::RecordNotFound do
    head :not_found
  end

  rescue_from ActionPolicy::Unauthorized do
    head :forbidden
  end
end

# frozen_string_literal: true

module Api
  module V1
    module Insights
      class CountriesController < BaseController
        def index
          authorize! Employee, to: :countries_insights?
          return render_validation_error([ country_code_error_detail ]) if invalid_country_code?

          render json: {
            data: {
              **::Insights::CountriesMetricsQuery.call(country_code: params[:country_code]),
              computed_at: Time.current.iso8601
            }
          }
        end
      end
    end
  end
end

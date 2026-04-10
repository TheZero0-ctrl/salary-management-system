# frozen_string_literal: true

module Api
  module V1
    module Insights
      class CountriesController < ApplicationController
        def index
          authorize! Employee, to: :countries_insights?
          return render_invalid_country_code unless valid_country_code?

          render json: {
            data: {
              **::Insights::CountriesMetricsQuery.call(country_code: params[:country_code]),
              computed_at: Time.current.iso8601
            }
          }
        end

        private

        def valid_country_code?
          params[:country_code].to_s.match?(/\A[A-Z]{2}\z/)
        end

        def render_invalid_country_code
          render_error(
            :unprocessable_entity,
            "Validation failed",
            code: "VALIDATION_ERROR",
            details: [ { field: "country_code", message: "must be a valid ISO alpha-2 code" } ]
          )
        end
      end
    end
  end
end

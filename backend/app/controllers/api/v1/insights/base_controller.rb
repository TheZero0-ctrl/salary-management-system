# frozen_string_literal: true

module Api
  module V1
    module Insights
      class BaseController < ApplicationController
        private

        COUNTRY_CODE_FORMAT = /\A[A-Z]{2}\z/

        def invalid_country_code?
          !params[:country_code].to_s.match?(COUNTRY_CODE_FORMAT)
        end

        def country_code_error_detail
          { field: "country_code", message: "must be a valid ISO alpha-2 code" }
        end

        def render_validation_error(details)
          render_error(:unprocessable_entity, "Validation failed", code: "VALIDATION_ERROR", details: details)
        end
      end
    end
  end
end

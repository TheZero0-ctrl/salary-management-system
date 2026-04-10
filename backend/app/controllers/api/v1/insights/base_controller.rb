# frozen_string_literal: true

module Api
  module V1
    module Insights
      class BaseController < ApplicationController
        private

        def invalid_country_code?
          !params[:country_code].to_s.match?(ValidationPatterns::COUNTRY_CODE)
        end

        def country_code_error_detail
          { field: "country_code", message: "must be a valid ISO alpha-2 code" }
        end

        def render_validation_error(details)
          render_api_error(:validation_error, details: details)
        end
      end
    end
  end
end

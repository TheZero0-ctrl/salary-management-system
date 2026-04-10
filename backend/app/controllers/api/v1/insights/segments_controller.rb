# frozen_string_literal: true

module Api
  module V1
    module Insights
      class SegmentsController < BaseController
        def index
          authorize! Employee, to: :segments_insights?

          details = validation_errors
          return render_validation_error(details) if details.any?

          render json: {
            data: {
              **::Insights::SegmentsMetricsQuery.call(country_code: params[:country_code], job_title: params[:job_title]),
              computed_at: Time.current.iso8601
            }
          }
        end

        private

        def validation_errors
          [ invalid_country_code_error, missing_job_title_error ].compact
        end

        def invalid_country_code_error
          return unless invalid_country_code?

          country_code_error_detail
        end

        def missing_job_title_error
          return unless params[:job_title].blank?

          { field: "job_title", message: "can't be blank" }
        end
      end
    end
  end
end

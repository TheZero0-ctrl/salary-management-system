# frozen_string_literal: true

module Api
  module V1
    module Insights
      class DistributionsController < BaseController
        def index
          authorize! Employee, to: :distributions_insights?

          details = validation_errors
          return render_validation_error(details) if details.any?

          render json: {
            data: {
              **::Insights::DistributionMetricsQuery.call(
                country_code: params[:country_code],
                job_title: params[:job_title],
                bucket_size: bucket_size
              ),
              computed_at: Time.current.iso8601
            }
          }
        end

        private

        def validation_errors
          [ invalid_country_code_error ].compact
        end

        def invalid_country_code_error
          return unless params[:country_code].present? && invalid_country_code?

          country_code_error_detail
        end

        def bucket_size
          parse_money_to_cents_param(
            params[:bucket_size],
            field: :bucket_size,
            min: 100
          ) || ::Insights::DistributionMetricsQuery::DEFAULT_BUCKET_SIZE
        end
      end
    end
  end
end

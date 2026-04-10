# frozen_string_literal: true

module Api
  module V1
    class EmployeesController < ApplicationController
      before_action :set_employee, only: [ :show, :update, :destroy ]
      rescue_from ActiveRecord::RecordNotFound, with: :render_employee_not_found

      def index
        authorize! Employee

        if invalid_sort_field?
          return render_api_error(:validation_error, message: "Unsupported sort field")
        end

        employees_scope = Employees::FilterQuery.call(filter_params)
        page, per_page = pagination_params
        pagy, employees = pagy(:offset, employees_scope, page:, limit: per_page)

        render json: {
          data: employees.map { |employee| Api::V1::EmployeePresenter.new(employee).as_json },
          meta: pagination_meta(pagy)
        }
      end

      def show
        authorize! @employee

        render json: { data: Api::V1::EmployeePresenter.new(@employee).as_json }
      end

      def create
        authorize! Employee

        result = Employees::CreateService.call(params: employee_params)

        return render_created_employee(result.employee) if result.success?

        render_service_error(result)
      end

      def update
        authorize! @employee

        result = Employees::UpdateService.call(employee: @employee, params: employee_params)

        return render_updated_employee(result.employee) if result.success?

        render_service_error(result)
      end

      def destroy
        authorize! @employee

        result = Employees::DestroyService.call(employee: @employee)

        return render_destroyed_employee if result.success?

        render_service_error(result)
      end

      private

      def invalid_sort_field?
        sort_by = params[:sort_by]
        return false if sort_by.blank?

        !Employees::FilterQuery::SORT_FIELDS.key?(sort_by.to_s)
      end

      def filter_params
        permitted = params.permit(
          :format,
          :page,
          :per_page,
          :country_code,
          :job_title,
          :department,
          :status,
          :salary_min,
          :salary_max,
          :search,
          :sort_by,
          :sort_direction
        )

        permitted[:salary_min] = normalized_salary_min
        permitted[:salary_max] = normalized_salary_max
        permitted
      end

      def set_employee
        @employee = Employee.not_deleted.find_by!(employee_code: params[:employee_code])
      end

      def employee_params
        params.require(:employee).permit(
          :employee_code,
          :full_name,
          :job_title,
          :country_code,
          :salary_cents,
          :employment_type,
          :effective_from,
          :status,
          :department,
          :hire_date,
          :last_salary_review_date
        )
      end

      def render_created_employee(employee)
        render json: { data: Api::V1::EmployeePresenter.new(employee).as_json }, status: :created
      end

      def render_updated_employee(employee)
        render json: { data: Api::V1::EmployeePresenter.new(employee).as_json }, status: :ok
      end

      def render_destroyed_employee
        head :no_content
      end

      def render_service_error(result)
        render_error(result.status, result.error, code: result.error_code, details: result.details)
      end

      def normalized_salary_min
        parse_integer_param(params[:salary_min], field: :salary_min, min: 0)
      end

      def normalized_salary_max
        parse_integer_param(params[:salary_max], field: :salary_max, min: 0)
      end

      def render_employee_not_found
        render_api_error(:employee_not_found)
      end
    end
  end
end

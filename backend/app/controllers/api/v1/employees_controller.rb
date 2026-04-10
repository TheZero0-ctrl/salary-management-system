# frozen_string_literal: true

module Api
  module V1
    class EmployeesController < ApplicationController
      before_action :set_employee, only: [ :show, :update, :destroy ]

      def index
        authorize! Employee

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

      def filter_params
        params.permit(
          :format,
          :page,
          :per_page,
          :country_code,
          :status,
          :salary_min,
          :salary_max,
          :term,
          :sort_by,
          :sort_direction
        )
      end

      def set_employee
        @employee = Employee.not_deleted.find_by!(employee_code: params[:employee_code])
      end

      def employee_params
        permitted_params = params.permit(
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

        requested_employee_code = request.request_parameters[:employee_code] || request.request_parameters["employee_code"]
        permitted_params[:employee_code] = requested_employee_code if requested_employee_code.present?

        permitted_params
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
        render json: { error: result.error }, status: result.status
      end
    end
  end
end

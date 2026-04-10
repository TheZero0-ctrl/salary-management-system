# frozen_string_literal: true

module Api
  module V1
    class EmployeePresenter
      attr_reader :employee

      def initialize(employee)
        @employee = employee
      end

      def as_json
        {
          id: employee.id,
          employee_code: employee.employee_code,
          full_name: employee.full_name,
          job_title: employee.job_title,
          country_code: employee.country_code,
          salary: (employee.salary_cents.to_d / 100).round(2).to_f,
          employment_type: employee.employment_type,
          effective_from: employee.effective_from,
          status: employee.status,
          department: employee.department,
          hire_date: employee.hire_date,
          last_salary_review_date: employee.last_salary_review_date
        }
      end
    end
  end
end

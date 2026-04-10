# frozen_string_literal: true

require "rails_helper"

RSpec.describe "DELETE /api/v1/employees/:employee_code", type: :request do
  DESTROY_EMPLOYEES_ENDPOINT = "/api/v1/employees"

  def authorization_header(role)
    email = "#{role}-#{SecureRandom.hex(4)}@example.com"
    password = "password123"

    user = create(:user, role: role, email_address: email, password: password)
    auth_headers_for(user, password: password)
  end

  def delete_employee(employee_code:, headers: nil)
    delete "#{DESTROY_EMPLOYEES_ENDPOINT}/#{employee_code}", headers:
  end

  it "returns 401 when unauthenticated" do
    employee = create(:employee)

    delete_employee(employee_code: employee.employee_code)

    expect(response).to have_http_status(:unauthorized)
    expect(json_response).to include("error" => "Unauthorized")
  end

  it "returns 403 for an authenticated non-hr-manager" do
    employee = create(:employee)

    delete_employee(employee_code: employee.employee_code, headers: authorization_header("employee"))

    expect(response).to have_http_status(:forbidden)
    expect(json_response).to include("error" => "You are not allowed to perform this action")
  end

  context "when authenticated as hr_manager" do
    let(:headers) { authorization_header("hr_manager") }

    it "returns 204 and soft-deletes the employee" do
      employee = create(:employee, deleted_at: nil)

      expect do
        delete_employee(employee_code: employee.employee_code, headers: headers)
      end.to change { employee.reload.deleted_at }.from(nil)

      expect(response).to have_http_status(:no_content)
    end

    it "returns 404 for an unknown employee code" do
      delete_employee(employee_code: "EMP-999999", headers: headers)

      expect(response).to have_http_status(:not_found)
      expect(json_response).to include("error" => "Resource not found")
    end

    it "excludes the employee from index and returns 404 for show after successful delete" do
      employee = create(:employee, deleted_at: nil)
      visible_employee = create(:employee, deleted_at: nil)

      delete_employee(employee_code: employee.employee_code, headers: headers)

      expect(response).to have_http_status(:no_content)

      get DESTROY_EMPLOYEES_ENDPOINT, headers: headers

      expect(response).to have_http_status(:ok)

      returned_ids = json_response.fetch("data").map { |item| item.fetch("id") }

      expect(returned_ids).to include(visible_employee.id)
      expect(returned_ids).not_to include(employee.id)

      get "#{DESTROY_EMPLOYEES_ENDPOINT}/#{employee.employee_code}", headers: headers

      expect(response).to have_http_status(:not_found)
      expect(json_response).to include("error" => "Resource not found")
    end
  end
end

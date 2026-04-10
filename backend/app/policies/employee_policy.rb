# frozen_string_literal: true

class EmployeePolicy < ApplicationPolicy
  def index?
    hr_manager?
  end

  def show?
    hr_manager?
  end

  private

  def hr_manager?
    user&.role == "hr_manager"
  end
end

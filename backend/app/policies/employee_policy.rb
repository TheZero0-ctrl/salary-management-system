# frozen_string_literal: true

class EmployeePolicy < ApplicationPolicy
  def index?
    hr_manager?
  end

  alias_method :show?, :index?
  alias_method :create?, :index?
  alias_method :update?, :index?
  alias_method :destroy?, :index?
  alias_method :countries_insights?, :index?

  private

  def hr_manager?
    user&.role == "hr_manager"
  end
end

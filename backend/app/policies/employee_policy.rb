# frozen_string_literal: true

class EmployeePolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end
end

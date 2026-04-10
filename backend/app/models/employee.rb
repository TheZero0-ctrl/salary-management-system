# frozen_string_literal: true

class Employee < ApplicationRecord
  enum :employment_type, { full_time: "full_time", part_time: "part_time", contractor: "contractor" }
  enum :status, { active: "active", inactive: "inactive", terminated: "terminated" }

  scope :not_deleted, -> { where(deleted_at: nil) }

  validates :employee_code, presence: true, length: { maximum: 32 }, format: { with: ValidationPatterns::EMPLOYEE_CODE }, uniqueness: true
  validates :full_name, presence: true, length: { minimum: 2, maximum: 120 }
  validates :job_title, presence: true, length: { minimum: 2, maximum: 120 }
  validates :country_code, presence: true, format: { with: ValidationPatterns::COUNTRY_CODE }
  validates :salary_cents, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :employment_type, presence: true, inclusion: { in: employment_types.keys }
  validates :effective_from, presence: true
  validates :status, presence: true, inclusion: { in: statuses.keys }
  validates :department, length: { maximum: 100 }, allow_nil: true

  validate :effective_from_cannot_be_in_future
  validate :hire_date_cannot_be_in_future
  validate :last_salary_review_date_cannot_be_before_hire_date

  def soft_delete!
    return if deleted_at.present?

    update!(deleted_at: Time.current)
  end

  private

  def effective_from_cannot_be_in_future
    add_future_date_error(:effective_from)
  end

  def hire_date_cannot_be_in_future
    add_future_date_error(:hire_date)
  end

  def last_salary_review_date_cannot_be_before_hire_date
    return if hire_date.blank? || last_salary_review_date.blank?
    return if last_salary_review_date >= hire_date

    errors.add(:last_salary_review_date, "cannot be before hire date")
  end

  def add_future_date_error(attribute)
    value = public_send(attribute)
    return if value.blank? || value <= Date.current

    errors.add(attribute, "cannot be in the future")
  end
end

require "rails_helper"

RSpec.describe Employee, type: :model do
  subject(:employee) { build(:employee) }

  describe "required fields" do
    it { is_expected.to validate_presence_of(:employee_code) }
    it { is_expected.to validate_presence_of(:full_name) }
    it { is_expected.to validate_presence_of(:job_title) }
    it { is_expected.to validate_presence_of(:country_code) }
    it { is_expected.to validate_presence_of(:salary_cents) }
    it { is_expected.to validate_presence_of(:employment_type) }
    it { is_expected.to validate_presence_of(:effective_from) }
    it { is_expected.to validate_presence_of(:status) }
  end

  describe "employee_code" do
    it { is_expected.to validate_length_of(:employee_code).is_at_most(32) }
    it { is_expected.to allow_value("EMP-1234", "EMP-99999").for(:employee_code) }
    it { is_expected.not_to allow_value("EMP-123", "emp-1234", "ABC-1234").for(:employee_code) }
    it { is_expected.to validate_uniqueness_of(:employee_code) }
  end

  describe "full_name" do
    it { is_expected.to validate_length_of(:full_name).is_at_least(2).is_at_most(120) }
  end

  describe "job_title" do
    it { is_expected.to validate_length_of(:job_title).is_at_least(2).is_at_most(120) }
  end

  describe "country_code" do
    it { is_expected.to allow_value("IN", "US").for(:country_code) }
    it { is_expected.not_to allow_value("in", "IND", "I").for(:country_code) }
  end

  describe "salary_cents" do
    it { is_expected.to validate_numericality_of(:salary_cents).only_integer.is_greater_than(0) }
  end

  describe "employment_type" do
    it { is_expected.to allow_value("full_time", "part_time", "contractor").for(:employment_type) }

    it "rejects unsupported values" do
      expect { employee.employment_type = "intern" }.to raise_error(ArgumentError)
    end
  end

  describe "status" do
    it { is_expected.to allow_value("active", "inactive", "terminated").for(:status) }

    it "rejects unsupported values" do
      expect { employee.status = "on_leave" }.to raise_error(ArgumentError)
    end
  end

  describe "effective_from" do
    it "is invalid when set in the future" do
      employee.effective_from = Date.current + 1

      expect(employee).not_to be_valid
      expect(employee.errors[:effective_from]).to be_present
    end
  end

  describe "department" do
    it { is_expected.to validate_length_of(:department).is_at_most(100) }
  end

  describe "hire_date" do
    it "is invalid when set in the future" do
      employee.hire_date = Date.current + 1

      expect(employee).not_to be_valid
      expect(employee.errors[:hire_date]).to be_present
    end
  end

  describe "last_salary_review_date" do
    it "is invalid when before hire_date" do
      employee.hire_date = Date.current
      employee.last_salary_review_date = Date.current - 1

      expect(employee).not_to be_valid
      expect(employee.errors[:last_salary_review_date]).to be_present
    end

    it "is valid when equal to hire_date" do
      employee.hire_date = Date.current
      employee.last_salary_review_date = Date.current

      employee.validate

      expect(employee.errors[:last_salary_review_date]).to be_empty
    end
  end

  describe ".not_deleted" do
    it "returns only records with deleted_at as nil" do
      active_employee = create(:employee, deleted_at: nil)
      create(:employee, deleted_at: 1.day.ago)

      expect(described_class.not_deleted).to contain_exactly(active_employee)
    end

    it "returns no records when all employees are soft-deleted" do
      create(:employee, deleted_at: 1.day.ago)
      create(:employee, deleted_at: 2.days.ago)

      expect(described_class.not_deleted).to be_empty
    end

    it "does not filter by employment status" do
      inactive_employee = create(:employee, status: "inactive", deleted_at: nil)
      terminated_employee = create(:employee, status: "terminated", deleted_at: nil)
      create(:employee, status: "active", deleted_at: 1.day.ago)

      expect(described_class.not_deleted).to contain_exactly(inactive_employee, terminated_employee)
    end
  end

  describe ".active" do
    it "returns only employees with active status" do
      active_employee = create(:employee, status: "active")
      create(:employee, status: "inactive")

      expect(described_class.active).to contain_exactly(active_employee)
    end

    it "includes soft-deleted records unless not_deleted is chained" do
      visible_active_employee = create(:employee, status: "active", deleted_at: nil)
      soft_deleted_active_employee = create(:employee, status: "active", deleted_at: 1.day.ago)

      expect(described_class.active).to contain_exactly(visible_active_employee, soft_deleted_active_employee)
      expect(described_class.active.not_deleted).to contain_exactly(visible_active_employee)
    end
  end

  describe "#soft_delete!" do
    it "sets deleted_at timestamp on the record" do
      employee = create(:employee, deleted_at: nil)

      expect { employee.soft_delete! }
        .to change { employee.reload.deleted_at }.from(nil)
    end

    it "is idempotent once deleted_at is set" do
      employee = create(:employee, deleted_at: nil)

      employee.soft_delete!
      first_deleted_at = employee.reload.deleted_at

      employee.soft_delete!

      expect(employee.reload.deleted_at).to eq(first_deleted_at)
    end
  end
end

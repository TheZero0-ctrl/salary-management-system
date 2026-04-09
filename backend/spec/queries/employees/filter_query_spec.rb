# frozen_string_literal: true

require "rails_helper"

RSpec.describe Employees::FilterQuery do
  describe ".call" do
    subject(:results) { described_class.call(params) }

    let(:params) { {} }

    it "excludes soft-deleted employees by default" do
      visible_employee = create(:employee, deleted_at: nil)
      create(:employee, deleted_at: 1.day.ago)

      expect(results).to contain_exactly(visible_employee)
    end

    context "when filtering by country_code" do
      let(:params) { { country_code: "US" } }

      it "returns only employees from the requested country" do
        matching_employee = create(:employee, country_code: "US", deleted_at: nil)
        create(:employee, country_code: "IN", deleted_at: nil)
        create(:employee, country_code: "US", deleted_at: 1.day.ago)

        expect(results).to contain_exactly(matching_employee)
      end
    end

    context "when filtering by status" do
      let(:params) { { status: "inactive" } }

      it "returns only employees with the requested status" do
        matching_employee = create(:employee, status: "inactive", deleted_at: nil)
        create(:employee, status: "active", deleted_at: nil)
        create(:employee, status: "inactive", deleted_at: 1.day.ago)

        expect(results).to contain_exactly(matching_employee)
      end
    end

    context "when filtering by salary range" do
      let(:params) { { salary_min: 100_000, salary_max: 200_000 } }

      it "returns only employees whose salary_cents is within the requested range" do
        lower_boundary = create(:employee, salary_cents: 100_000, deleted_at: nil)
        upper_boundary = create(:employee, salary_cents: 200_000, deleted_at: nil)
        create(:employee, salary_cents: 99_999, deleted_at: nil)
        create(:employee, salary_cents: 200_001, deleted_at: nil)

        expect(results).to contain_exactly(lower_boundary, upper_boundary)
      end
    end

    context "when searching by term" do
      let(:params) { { term: "joHn" } }

      it "matches full_name using case-insensitive partial search" do
        matching_employee = create(:employee, full_name: "Alice Johnson", employee_code: "EMP-7001")
        create(:employee, full_name: "Mark Stone", employee_code: "EMP-7002")

        expect(results).to contain_exactly(matching_employee)
      end

      it "matches employee_code using case-insensitive partial search" do
        matching_employee = create(:employee, employee_code: "EMP-12345", full_name: "Taylor Smith")
        create(:employee, employee_code: "EMP-98765", full_name: "Jordan Lee")

        expect(described_class.call(term: "emp-123")).to contain_exactly(matching_employee)
      end
    end

    context "when sorting by a requested field and direction" do
      let(:params) { { sort_by: "full_name", sort_direction: "asc" } }

      it "uses id ASC as deterministic tie-breaker" do
        first_alex = create(:employee, full_name: "Alex Doe")
        second_alex = create(:employee, full_name: "Alex Doe")
        sam = create(:employee, full_name: "Sam Doe")

        expect(results.pluck(:id)).to eq([ first_alex.id, second_alex.id, sam.id ])
      end
    end

    context "when sort field is missing" do
      it "defaults to deterministic id ASC ordering" do
        first_created = create(:employee)
        second_created = create(:employee)
        third_created = create(:employee)

        expect(described_class.call.pluck(:id)).to eq([ first_created.id, second_created.id, third_created.id ])
      end
    end

    context "when sort field is invalid" do
      let(:params) { { sort_by: "unknown", sort_direction: "desc" } }

      it "defaults to deterministic id ASC ordering" do
        first_created = create(:employee)
        second_created = create(:employee)

        expect(results.pluck(:id)).to eq([ first_created.id, second_created.id ])
      end
    end

    context "when sort direction is invalid" do
      let(:params) { { sort_by: "full_name", sort_direction: "sideways" } }

      it "defaults to ascending order" do
        zed = create(:employee, full_name: "Zed")
        amy = create(:employee, full_name: "Amy")

        expect(results).to eq([ amy, zed ])
      end
    end

    context "when status filter is invalid" do
      let(:params) { { status: "on_leave" } }

      it "returns no records" do
        create(:employee, status: "active")

        expect(results).to be_empty
      end
    end

    context "when paginating" do
      let(:params) { { page: 2, per_page: 2 } }

      it "uses 1-based page indexing with a minimum page size of 10" do
        employees = Array.new(20) { create(:employee) }

        expect(results).to eq(employees[10..19])
        expect(described_class.call(page: 1, per_page: 2)).to eq(employees[0..9])
      end
    end
  end
end

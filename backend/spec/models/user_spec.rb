require "rails_helper"

RSpec.describe User, type: :model do
  describe "associations" do
    it { is_expected.to have_many(:refresh_tokens).dependent(:destroy) }
  end

  describe "validations" do
    subject(:user) { build(:user) }

    it { is_expected.to validate_presence_of(:email_address) }
    it { is_expected.to validate_presence_of(:role) }

    it "rejects an unsupported role" do
      expect { build(:user, role: "admin") }.to raise_error(ArgumentError, /is not a valid role/)
    end
  end

  describe "normalization" do
    it "normalizes email_address by stripping and downcasing" do
      user = create(:user, email_address: "  TEST.USER@Example.COM  ")

      expect(user.email_address).to eq("test.user@example.com")
    end
  end

  describe "jti" do
    it "assigns a unique jti on create" do
      first_user = create(:user)
      second_user = create(:user)

      expect(first_user.jti).to be_present
      expect(second_user.jti).to be_present
      expect(first_user.jti).not_to eq(second_user.jti)
    end
  end

  describe "role enum" do
    it "defines expected role values" do
      expect(described_class.roles).to eq(
        "hr_manager" => "hr_manager",
        "employee" => "employee"
      )
    end
  end
end

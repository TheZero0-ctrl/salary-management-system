# spec/models/user_spec.rb
require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'associations' do
    it { is_expected.to have_many(:items).dependent(:destroy) }
    it { is_expected.to belong_to(:organization) }
  end

  describe 'validations' do
    subject { build(:user) }

    it { is_expected.to validate_presence_of(:email) }
    it { is_expected.to validate_uniqueness_of(:email).case_insensitive }
    it { is_expected.to validate_length_of(:username).is_at_least(3) }
  end

  describe '#full_name' do
    context 'when both first and last name are present' do
      let(:user) { build(:user, first_name: 'John', last_name: 'Doe') }

      it 'returns the full name' do
        expect(user.full_name).to eq('John Doe')
      end
    end

    context 'when only first name is present' do
      let(:user) { build(:user, first_name: 'John', last_name: nil) }

      it 'returns only the first name' do
        expect(user.full_name).to eq('John')
      end
    end
  end

  describe 'scopes' do
    describe '.active' do
      let!(:active_user) { create(:user, status: 'active') }
      let!(:inactive_user) { create(:user, status: 'inactive') }

      it 'returns only active users' do
        expect(User.active).to contain_exactly(active_user)
      end
    end
  end
end

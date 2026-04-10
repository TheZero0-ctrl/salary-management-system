FactoryBot.define do
  factory :user do
    sequence(:email_address) { |n| "user#{n}@example.com" }
    password { "password" }
    role { "employee" }

    trait :hr_manager do
      role { "hr_manager" }
    end
  end
end

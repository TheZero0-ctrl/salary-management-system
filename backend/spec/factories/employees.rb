FactoryBot.define do
  factory :employee do
    sequence(:employee_code) { |n| "EMP-#{format('%04d', n)}" }
    full_name { "Jane Doe" }
    job_title { "Software Engineer" }
    country_code { "IN" }
    salary_cents { 100_000 }
    employment_type { "full_time" }
    effective_from { Date.current }
    status { "active" }
    department { "Engineering" }
    hire_date { Date.current - 30 }
    last_salary_review_date { Date.current - 1 }
  end
end

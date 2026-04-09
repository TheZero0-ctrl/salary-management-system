class CreateEmployees < ActiveRecord::Migration[8.1]
  def change
    create_table :employees do |t|
      t.string :employee_code, null: false
      t.string :full_name, null: false
      t.string :job_title, null: false
      t.string :department
      t.string :country_code, null: false
      t.bigint :salary_cents, null: false
      t.string :employment_type, null: false, default: "full_time"
      t.string :status, null: false, default: "active"
      t.date :effective_from, null: false
      t.date :hire_date
      t.date :last_salary_review_date
      t.datetime :deleted_at

      t.timestamps
    end
  end
end

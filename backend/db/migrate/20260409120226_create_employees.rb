class CreateEmployees < ActiveRecord::Migration[8.1]
  def change
    create_table :employees do |t|
      t.string :employee_code
      t.string :full_name
      t.string :job_title
      t.string :department
      t.string :country_code
      t.string :currency_code
      t.decimal :salary_amount, precision: 12, scale: 2
      t.string :employment_type
      t.string :status
      t.date :effective_from
      t.date :hire_date
      t.date :last_salary_review_date
      t.datetime :deleted_at

      t.timestamps
    end
  end
end

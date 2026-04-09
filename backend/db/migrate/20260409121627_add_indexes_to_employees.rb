class AddIndexesToEmployees < ActiveRecord::Migration[8.1]
  def change
    add_index :employees, :employee_code, unique: true
    add_index :employees, :country_code
    add_index :employees, :job_title
    add_index :employees, :status
    add_index :employees, [ :country_code, :job_title ]
    add_index :employees, [ :country_code, :salary_cents ]
    add_index :employees, :deleted_at
  end
end

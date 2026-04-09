# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_04_09_121627) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "employees", force: :cascade do |t|
    t.string "country_code", null: false
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.string "department"
    t.date "effective_from", null: false
    t.string "employee_code", null: false
    t.string "employment_type", default: "full_time", null: false
    t.string "full_name", null: false
    t.date "hire_date"
    t.string "job_title", null: false
    t.date "last_salary_review_date"
    t.bigint "salary_cents", null: false
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.index ["country_code", "job_title"], name: "index_employees_on_country_code_and_job_title"
    t.index ["country_code", "salary_cents"], name: "index_employees_on_country_code_and_salary_cents"
    t.index ["country_code"], name: "index_employees_on_country_code"
    t.index ["deleted_at"], name: "index_employees_on_deleted_at"
    t.index ["employee_code"], name: "index_employees_on_employee_code", unique: true
    t.index ["job_title"], name: "index_employees_on_job_title"
    t.index ["status"], name: "index_employees_on_status"
  end
end

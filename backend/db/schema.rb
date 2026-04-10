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

ActiveRecord::Schema[8.1].define(version: 2026_04_10_130000) do
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

  create_table "refresh_tokens", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.datetime "revoked_at"
    t.string "token_digest", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["expires_at"], name: "index_refresh_tokens_on_expires_at"
    t.index ["token_digest"], name: "index_refresh_tokens_on_token_digest", unique: true
    t.index ["user_id", "revoked_at"], name: "index_refresh_tokens_on_user_id_and_revoked_at"
    t.index ["user_id"], name: "index_refresh_tokens_on_user_id"
  end

  create_table "revoked_access_tokens", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "jti", null: false
    t.datetime "updated_at", null: false
    t.index ["expires_at"], name: "index_revoked_access_tokens_on_expires_at"
    t.index ["jti"], name: "index_revoked_access_tokens_on_jti", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email_address", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "jti", default: "", null: false
    t.string "role", default: "employee", null: false
    t.datetime "updated_at", null: false
    t.index ["email_address"], name: "index_users_on_email_address", unique: true
    t.index ["jti"], name: "index_users_on_jti", unique: true
    t.index ["role"], name: "index_users_on_role"
  end

  add_foreign_key "refresh_tokens", "users"
end

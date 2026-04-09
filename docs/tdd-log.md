# TDD Log

## Step 1 - feat(db): add employees table with core columns

### RED (tests first)
- Added DB schema expectations in `backend/spec/db/employees_table_schema_spec.rb` for:
  - `employees` table existence
  - required columns and timestamps

### GREEN (minimum implementation)
- Added initial migration `backend/db/migrate/20260409120226_create_employees.rb` to create `employees` with core columns and constraints.

### REFACTOR
- None in this step.

## Step 2 - feat(backend): add employee schema and model validation baseline

### RED (tests first)
- Added model expectations in `backend/spec/models/employee_spec.rb` for required fields, formats, enums, and date consistency rules.
- Added schema-level checks in `backend/spec/db/employees_table_schema_spec.rb` for table columns and indexes.
- Added test data setup in `backend/spec/factories/employees.rb` to support model specs.

### GREEN (minimum implementation)
- Implemented Employee domain rules in `backend/app/models/employee.rb`:
  - enum values for `employment_type` and `status`
  - validations for required fields, formats, lengths, uniqueness, and numeric constraints
  - date consistency checks (`effective_from`, `hire_date`, `last_salary_review_date`)
- Updated DB structure to satisfy schema expectations:
  - `backend/db/migrate/20260409120226_create_employees.rb`
  - `backend/db/migrate/20260409121627_add_indexes_to_employees.rb`

### REFACTOR
- Minor internal cleanup in model validation flow by using focused private validation helpers (no behavior change).

## Step 3 - feat(backend): add soft-delete behavior on the employee

### RED (tests first)
- Added model specs in `backend/spec/models/employee_spec.rb` for `#soft_delete!`, `.not_deleted`, and scope behavior between `.active` and `.not_deleted`.

### GREEN (minimum implementation)
- Updated `backend/app/models/employee.rb` with `scope :not_deleted` and idempotent `#soft_delete!`.

### REFACTOR
- Renamed soft-delete scope from `.active` to `.not_deleted` to avoid enum scope conflict.

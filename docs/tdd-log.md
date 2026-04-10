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

## Step 4 - feat(backend): add employees filter query object

### RED (tests first)
- Added query specs in `backend/spec/queries/employees/filter_query_spec.rb` for visibility, filters, search, sorting, and pagination behavior.

### GREEN (minimum implementation)
- Added `backend/app/queries/employees/filter_query.rb` to implement filtering/search/sort/pagination with deterministic ordering.

### REFACTOR
- Aligned query structure with `ApplicationQuery` pattern by adding `backend/app/queries/application_query.rb` and updating `Employees::FilterQuery` to use it.

## Step 5 - feat(api): add employees index endpoint with controller pagination

### RED (tests first)
- Added request specs in `backend/spec/requests/api/v1/employees/index_spec.rb` for paginated listing, soft-delete exclusion, and country filter behavior.

### GREEN (minimum implementation)
- Added API route and controller index action:
  - `backend/config/routes.rb`
  - `backend/app/controllers/api/v1/employees_controller.rb`
- Added Pagy support in `backend/app/controllers/application_controller.rb`.
- Moved pagination out of query object by updating `backend/app/queries/employees/filter_query.rb` and keeping pagination in controller.
- Updated `backend/spec/queries/employees/filter_query_spec.rb` to keep query scope focused on filtering/search/sorting only.

### REFACTOR
- Simplified controller pagination param parsing with shared helper and constants in `backend/app/controllers/api/v1/employees_controller.rb`.

## Step 6 - feat(backend): implement employees index and show endpoints

### RED (tests first)
- Expanded request specs to define read API contract for list and detail endpoints:
  - `backend/spec/requests/api/v1/employees/index_spec.rb`
  - `backend/spec/requests/api/v1/employees/show_spec.rb`
- Added coverage for deterministic sorting tie-breaks, stable response shape fields, `404` behavior for missing/soft-deleted records, and `403` behavior for policy denial on index/show.

### GREEN (minimum implementation)
- Implemented show endpoint and route by business identifier:
  - `backend/config/routes.rb`
  - `backend/app/controllers/api/v1/employees_controller.rb`
- Added authorization and policy wiring using Action Policy:
  - `backend/Gemfile`
  - `backend/app/controllers/application_controller.rb`
  - `backend/app/policies/application_policy.rb`
  - `backend/app/policies/employee_policy.rb`
- Added stable employee presenter output for both index and show:
  - `backend/app/presenters/api/v1/employee_presenter.rb`

### REFACTOR
- Extracted shared pagination logic into concern and included it in base controller:
  - `backend/app/controllers/concerns/pagination_params.rb`
  - `backend/app/controllers/application_controller.rb`
- Aligned pagination defaults/caps with reference pattern (`DEFAULT_PAGE = 1`, `DEFAULT_PER_PAGE = 12`, `MAX_PER_PAGE = 50`).
- Fixed show lookup to use route param `employee_code` and corrected callback to `before_action` in `backend/app/controllers/api/v1/employees_controller.rb`.

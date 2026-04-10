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

## Step 5 - feat(backend): add employees index endpoint with controller pagination

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

## Step 7 - feat(backend): implement API auth with devise-jwt, refresh tokens, and role guards

### RED (tests first)
- Added/updated request specs for API auth contract and access control:
  - `backend/spec/requests/api/v1/session/create_spec.rb`
  - `backend/spec/requests/api/v1/session/refresh_spec.rb`
  - `backend/spec/requests/api/v1/session/destroy_spec.rb`
  - `backend/spec/requests/api/v1/employees/index_spec.rb`
  - `backend/spec/requests/api/v1/employees/show_spec.rb`
- Defined expected flows for:
  - login success/failure (`200` / `401`)
  - refresh token rotation and reuse rejection (`200` / `401`)
  - logout refresh revocation (`204` / `401`)
  - employee endpoint authz (`401` unauthenticated, `403` non-hr-manager, `200` hr_manager)

### GREEN (minimum implementation)
- Switched to standard API auth stack with Devise + JWT:
  - `backend/Gemfile`
  - `backend/config/initializers/devise.rb`
  - `backend/app/models/user.rb`
  - `backend/app/controllers/application_controller.rb`
- Added API session endpoints and refresh token lifecycle:
  - `backend/app/controllers/api/v1/sessions_controller.rb`
  - `backend/app/models/refresh_token.rb`
  - `backend/config/routes.rb`
- Added DB support for users and refresh tokens:
  - `backend/db/migrate/20260410110000_create_users.rb`
  - `backend/db/migrate/20260410120001_create_refresh_tokens.rb`
  - `backend/db/schema.rb`
- Enforced role policy for employee access:
  - `backend/app/policies/employee_policy.rb`

### REFACTOR
- Removed obsolete custom/session auth artifacts after devise-jwt adoption:
  - `backend/app/controllers/concerns/authentication.rb`
  - `backend/app/services/jwt_service.rb`
  - `backend/app/models/session.rb`
- Consolidated early-stage user migration history into a clean baseline migration (`create_users`) suitable for reset-based development.
- Added login rate limit coverage and test compatibility:
  - `backend/app/controllers/api/v1/sessions_controller.rb`
  - `backend/config/environments/test.rb`

## Step 8 - extract reusable request auth helpers into spec support

### RED (tests first)
- No behavior-spec additions; this was a pure test refactor with existing request suite as safety net.

### GREEN (minimum implementation)
- Added shared request auth helpers in:
  - `backend/spec/support/authentication_helpers.rb`
- Enabled support auto-loading and helper inclusion for request specs:
  - `backend/spec/rails_helper.rb`

### REFACTOR
- Replaced duplicated login/token/header setup across request specs with helper usage:
  - `backend/spec/requests/api/v1/employees/index_spec.rb`
  - `backend/spec/requests/api/v1/employees/show_spec.rb`
  - `backend/spec/requests/api/v1/session/create_spec.rb`
  - `backend/spec/requests/api/v1/session/refresh_spec.rb`
  - `backend/spec/requests/api/v1/session/destroy_spec.rb`

## Step 9 - feat(backend): add employees create endpoint with service and request specs

### RED (tests first)
- Added request specs in `backend/spec/requests/api/v1/employees/create_spec.rb` for:
  - `401` when unauthenticated
  - `403` for authenticated non-`hr_manager`
  - `201` with persisted employee and stable response fields for valid `hr_manager` requests
  - `422` for invalid payloads with no record creation
  - `409` for duplicate `employee_code` with no record creation

### GREEN (minimum implementation)
- Added employees create route and controller action:
  - `backend/config/routes.rb`
  - `backend/app/controllers/api/v1/employees_controller.rb`
- Added policy authorization for create:
  - `backend/app/policies/employee_policy.rb`
- Added create service to encapsulate creation outcome mapping:
  - `backend/app/services/employees/create_service.rb`

### REFACTOR
- Extracted focused response helpers in controller create flow to keep action intent clear.
- Extracted focused result builders in create service for success/conflict/validation outcomes.
- Simplified create request spec setup with shared endpoint constant and helper method.

## Step 10 - feat(backend): add employees update endpoint with service and request specs

### RED (tests first)
- Added request specs in `backend/spec/requests/api/v1/employees/update_spec.rb` for:
  - `401` when unauthenticated
  - `403` for authenticated non-`hr_manager`
  - `200` with updated fields for valid `hr_manager` requests
  - `422` for invalid payloads without persisting invalid changes
  - `409` for duplicate `employee_code` updates
  - `404` for unknown employee code

### GREEN (minimum implementation)
- Added employees update route and controller action:
  - `backend/config/routes.rb`
  - `backend/app/controllers/api/v1/employees_controller.rb`
- Added policy authorization for update:
  - `backend/app/policies/employee_policy.rb`
- Added update service to encapsulate update outcome mapping:
  - `backend/app/services/employees/update_service.rb`

### REFACTOR
- Consolidated create/update error rendering into one controller helper (`render_service_error`) in `backend/app/controllers/api/v1/employees_controller.rb`.
- Reduced policy duplication by aliasing `show?`, `create?`, and `update?` to `index?` in `backend/app/policies/employee_policy.rb`.

## Step 11 - feat(backend): add employees soft-delete endpoint with service and request specs

### RED (tests first)
- Added request specs in `backend/spec/requests/api/v1/employees/destroy_spec.rb` for:
  - `401` when unauthenticated
  - `403` for authenticated non-`hr_manager`
  - `204` with soft-delete behavior (`deleted_at` set) for valid `hr_manager` requests
  - `404` for unknown employee code
  - post-delete visibility rules (`index` excludes record and `show` returns `404`)

### GREEN (minimum implementation)
- Added employees destroy route and controller action:
  - `backend/config/routes.rb`
  - `backend/app/controllers/api/v1/employees_controller.rb`
- Added policy authorization for destroy:
  - `backend/app/policies/employee_policy.rb`
- Added destroy service to encapsulate soft-delete operation:
  - `backend/app/services/employees/destroy_service.rb`

### REFACTOR
- Kept controller flow consistent with create/update by using service-result rendering helpers in `backend/app/controllers/api/v1/employees_controller.rb`.
- Extracted success/error result builders in `backend/app/services/employees/destroy_service.rb` for consistency with other employee services.
- Renamed request-spec endpoint constant to `DESTROY_EMPLOYEES_ENDPOINT` in `backend/spec/requests/api/v1/employees/destroy_spec.rb` to avoid constant redefinition noise in multi-file runs.

## Step 12 - feat(backend): validate unsupported sort field for employees index

### RED (tests first)
- Added request spec coverage in `backend/spec/requests/api/v1/employees/index_spec.rb` for unsupported sort field behavior:
  - authenticated `hr_manager` request with invalid `sort_by` returns `422`
  - response includes an `error` key

### GREEN (minimum implementation)
- Added guard validation in `backend/app/controllers/api/v1/employees_controller.rb` to reject unsupported `sort_by` values before running the query.
- Reused `Employees::FilterQuery::SORT_FIELDS` as the allowlist source.

### REFACTOR
- No additional refactor changes were needed; guard method and early return were already clear and consistent with controller style.

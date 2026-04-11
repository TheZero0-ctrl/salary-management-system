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

## Step 13 - feat(backend): add country salary insights endpoint with auth and aggregate contract

### RED (tests first)
- Added request specs in `backend/spec/requests/api/v1/insights/countries_spec.rb` for:
  - `401` when unauthenticated
  - `403` for authenticated non-`hr_manager`
  - `200` with `data.min/max/avg/median/stddev/count/computed_at` for authenticated `hr_manager`
  - aggregate correctness for deterministic fixture salaries

### GREEN (minimum implementation)
- Added insights route and controller endpoint:
  - `backend/config/routes.rb`
  - `backend/app/controllers/api/v1/insights/countries_controller.rb`
- Wired authorization through employee policy and implemented country salary aggregation endpoint.

### REFACTOR
- Extracted aggregation computation away from controller into dedicated insight layer before further optimization.

## Step 14 - standardize error envelope, improve insights performance, and add service bases

### RED (tests first)
- Expanded request specs to verify standardized error envelope (`error.code/message/details/request_id`) and insight edge-cases:
  - invalid/missing `country_code` returns `422` with field-level details
  - empty-country result returns nil aggregates and `count: 0`
- Updated existing request specs to assert new envelope contract across employee/session/insights endpoints.

### GREEN (minimum implementation)
- Standardized API error rendering in `backend/app/controllers/application_controller.rb` and updated session/employee controllers to use it:
  - `backend/app/controllers/application_controller.rb`
  - `backend/app/controllers/api/v1/sessions_controller.rb`
  - `backend/app/controllers/api/v1/employees_controller.rb`
- Improved insights performance by moving aggregate math to SQL query object:
  - `backend/app/queries/insights/countries_metrics_query.rb`
  - `backend/app/controllers/api/v1/insights/countries_controller.rb`
- Added explicit insights authorization action:
  - `backend/app/policies/employee_policy.rb` (`countries_insights?`)
- Added service inheritance foundations:
  - `backend/app/services/application_service.rb`
  - `backend/app/services/insights/base_service.rb`
  - updated existing services to inherit from `ApplicationService`
- Added shared spec helper for envelope assertions:
  - `backend/spec/support/authentication_helpers.rb`

### REFACTOR
- Removed thin wrapper service `backend/app/services/insights/countries_salary_summary.rb` after switching to direct query-object usage in controller.
- Kept controller focused on auth/validation/rendering while query object handles DB aggregation.
- Verified the full suite after contract/performance updates (`121` examples passing).

## Step 15 - feat(backend): add segment salary insights endpoint with percentile metrics

### RED (tests first)
- Added request specs in `backend/spec/requests/api/v1/insights/segments_spec.rb` for:
  - `401` when unauthenticated
  - `403` for authenticated non-`hr_manager`
  - `422` for missing/invalid `country_code`
  - `422` for missing `job_title`
  - `200` with `data.min/max/avg/median/p25/p75/p90/count/computed_at` for authenticated `hr_manager`
  - aggregate filtering behavior (only non-deleted + exact `country_code` and `job_title`)
  - empty-result contract with nil metrics and `count: 0`

### GREEN (minimum implementation)
- Added insights segments route and endpoint implementation:
  - `backend/config/routes.rb`
  - `backend/app/controllers/api/v1/insights/segments_controller.rb`
- Added dedicated aggregation query object for segment percentiles:
  - `backend/app/queries/insights/segments_metrics_query.rb`
- Added policy alias for endpoint authorization:
  - `backend/app/policies/employee_policy.rb` (`segments_insights?`)

### REFACTOR
- Reduced validation duplication between insights controllers by extracting shared country-code validation and validation-error rendering into:
  - `backend/app/controllers/api/v1/insights/base_controller.rb`
- Updated both insights controllers to reuse the shared validation helpers:
  - `backend/app/controllers/api/v1/insights/countries_controller.rb`
  - `backend/app/controllers/api/v1/insights/segments_controller.rb`

## Frontend

## Step 1 - feat(auth): add login page with test harness, validation, and UI polish

### RED (tests first)
- Added minimal frontend test infrastructure and failing login specs for rendering + validation:
  - `frontend/vitest.config.ts`
  - `frontend/src/app/__tests__/login-page.test.tsx`
- Updated frontend package scripts/dependencies for Vitest + RTL:
  - `frontend/package.json`
  - `frontend/package-lock.json`
- Defined failures for:
  - missing login page module import (`../login/page`)
  - empty submit should render `Email is required` and `Password is required`

### GREEN (minimum implementation)
- Added `/login` page and implemented required behavior:
  - `frontend/src/app/login/page.tsx`
- Implemented accessible form fields and button text expected by tests (`Email`, `Password`, `Sign in`).
- Implemented client-side empty-submit validation and inline error rendering.
- Added a clean form layout aligned with app shell tokens.

### REFACTOR
- Extracted validation helpers and typed error state for readability:
  - `LoginField`, `ValidationErrors`, `getTrimmedFormValue`, `validateLoginForm`
  - `frontend/src/app/login/page.tsx`
- Switched submit handler type to `SubmitEvent<HTMLFormElement>` to avoid deprecated `FormEvent` usage.
- Polished login UI further and standardized pointer cursor behavior for buttons:
  - `frontend/src/app/login/page.tsx`
  - `frontend/src/app/globals.css`

## Step 2 - feat(frontend): standardize login API integration with base URL

### RED (tests first)
- Extended login page specs to define API integration and submit UX contract in `frontend/src/app/__tests__/login-page.test.tsx`:
  - invalid credentials from API should render inline `Invalid email or password`
  - submit should call configured base URL endpoint (`NEXT_PUBLIC_API_BASE_URL` + `/session`)
  - pending submit should disable button and show `Signing in...`
  - rejected/network request should show fallback auth error and re-enable submit

### GREEN (minimum implementation)
- Implemented login API integration and pending-state UX in `frontend/src/app/login/page.tsx`.
- Added centralized frontend API base URL and session client helpers:
  - `frontend/src/lib/api/base-url.ts`
  - `frontend/src/lib/api/session.ts`
- Added test setup for DOM matchers used by the frontend specs:
  - `frontend/src/test/setup.ts`
  - `frontend/vitest.config.ts`
- Updated frontend dev dependencies for test matcher support:
  - `frontend/package.json`
  - `frontend/package-lock.json`

### REFACTOR
- Standardized inline error presentation across field-level and auth-level messages using a shared `InlineError` helper in `frontend/src/app/login/page.tsx`.
- Hardened auth error extraction to handle non-JSON failures with deterministic fallback message.
- Kept all behavior unchanged while simplifying fallback control flow in error parsing.

## Step 3 - feat(frontend): persist tokens and redirect after successful login

### RED (tests first)
- Extended login page specs in `frontend/src/app/__tests__/login-page.test.tsx` for success-path behavior:
  - redirect to `/employees` after successful login response
  - persist `access_token` and `refresh_token` after successful login

### GREEN (minimum implementation)
- Updated `frontend/src/app/login/page.tsx` to parse token pair payload from successful session response.
- Persisted session tokens with token store helpers before navigation.
- Kept existing validation/error/loading behavior unchanged.

### REFACTOR
- Extracted `SessionResponseBody` typing and `persistSessionTokens` helper in `frontend/src/app/login/page.tsx` for clearer success-path intent.

## Step 4 - feat(frontend): add protected fetch refresh mechanism and route guard

### RED (tests first)
- Added auth-client tests in `frontend/src/lib/api/__tests__/auth-client.test.ts` for:
  - bearer header injection from access token
  - refresh + retry behavior on `401`
  - clear-session behavior when refresh fails
  - single-flight refresh under concurrent `401` responses
- Added protected-route tests in `frontend/src/app/__tests__/employees-page.test.tsx` for redirecting unauthenticated users to `/login`.
- Added token-store unit tests in `frontend/src/lib/auth/__tests__/token-store.test.ts` to define memory-vs-storage token strategy.

### GREEN (minimum implementation)
- Added token store in `frontend/src/lib/auth/token-store.ts`:
  - access token in memory
  - refresh token in local storage
  - clear helpers for logout/unauthenticated paths
- Added `frontend/src/lib/api/auth-client.ts` with refresh-on-401 retry and single-flight refresh handling.
- Added protected route hook `frontend/src/lib/auth/use-protected-route.ts` and applied it to:
  - `frontend/src/app/employees/page.tsx`
  - `frontend/src/app/insights/page.tsx`

### REFACTOR
- Reduced duplication in auth-client refresh-failure paths via helper function extraction.
- Improved protected-route readability with explicit naming and login-path constant.

## Step 5 - feat(frontend): add logout service and header logout action

### RED (tests first)
- Added logout service tests in `frontend/src/lib/auth/__tests__/session-manager.test.ts` for backend call contract and always-clear behavior.
- Added nav auth-action tests in `frontend/src/components/auth/__tests__/auth-nav-actions.test.tsx` for:
  - authenticated `Log out` rendering
  - pending logout state (`Logging out...`)
  - logout action + redirect to `/login`
  - unauthenticated `Login` link rendering

### GREEN (minimum implementation)
- Added `frontend/src/lib/auth/session-manager.ts` to call `DELETE /api/v1/session` with bearer + refresh token and always clear tokens.
- Added `frontend/src/components/auth/auth-nav-actions.tsx` and integrated it into `frontend/src/app/layout.tsx`.

### REFACTOR
- Performed small naming/readability cleanup in logout/auth nav logic without behavior changes.

## Step 6 - chore(frontend): add auth/workspace route-group shells and align runtime layout

### RED (tests first)
- Added route-shell integration specs in `frontend/src/app/__tests__/route-shell-layouts.test.tsx` for:
  - protected content rendering inside a workspace shell with primary navigation links (`Employees`, `Insights`)
  - login content rendering in an auth-only shell with no workspace header/nav
- Initial run failed as expected because route-group layouts did not exist yet (`../(auth)/layout` and `../(workspace)/layout`).

### GREEN (minimum implementation)
- Added route-group layouts:
  - `frontend/src/app/(auth)/layout.tsx`
  - `frontend/src/app/(workspace)/layout.tsx`
- Added minimal `PrimaryNav` support to force workspace links in workspace-shell tests:
  - `frontend/src/components/auth/primary-nav.tsx` (`showWorkspaceLinks`)

### REFACTOR
- Moved pages into route groups so shells are applied at runtime while URLs remain unchanged:
  - `frontend/src/app/(auth)/login/page.tsx`
  - `frontend/src/app/(workspace)/employees/page.tsx`
  - `frontend/src/app/(workspace)/insights/page.tsx`
- Simplified root layout to global document shell only:
  - `frontend/src/app/layout.tsx`
- Restored SPA logout navigation in `frontend/src/components/auth/auth-nav-actions.tsx` and updated shell tests to mock router where needed.
- Updated impacted test imports after route moves:
  - `frontend/src/app/__tests__/login-page.test.tsx`
  - `frontend/src/app/__tests__/employees-page.test.tsx`

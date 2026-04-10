# Salary Management API: Refined Feature Spec and Implementation Plan

## 1) Feature Summary
- **Complexity:** Large
- **Feature branch:** `feature/salary-management-api`
- **Primary persona:** `HR Manager` (single persona for current release)
- **Purpose:** Provide a reliable API to manage employee salary records and generate salary insights for HR decision-making.
- **Value proposition:** HR Manager can maintain accurate compensation data and quickly analyze salary distributions by country and role from one system.
- **Auth mode:** API-only auth using Rails generated authentication, enhanced with JWT bearer tokens.

## 2) Measurable Success Criteria (Definition of Done)
1. `POST /api/v1/employees` returns `201` for valid payloads and persists data with `created_at` and `updated_at`.
2. Invalid create/update requests return `422` with field-level errors in the standard error envelope.
3. Duplicate `employee_code` returns `409` with error code `DUPLICATE_EMPLOYEE_CODE`.
4. `GET /api/v1/employees` with 10k+ rows and `per_page=50` meets `p95 <= 300ms` in staging profile.
5. List endpoints produce deterministic ordering for repeated requests with same params.
6. Country and segment insights include required metrics plus `computed_at` timestamp in all success responses.
7. Soft-deleted employees are excluded from active list/read flows.
8. Deterministic import mode is idempotent across repeated runs with same seed and source data.
9. Unauthorized or unauthenticated requests return `403` or `401` with no sensitive data leakage.

## 3) Persona and Authorization Scope

### Persona: HR Manager
- Can create, read, update, soft-delete employee records.
- Can access country-level and segment-level salary insights.
- Can execute import/generator operations in authorized environments.

### Authorization Rules
- Current release supports one application role in `users.role` (string): `hr_manager`.
- Authenticated `hr_manager`: allowed on all in-scope API actions.
- Unauthenticated caller: denied (`401`).
- Authenticated non-`hr_manager` caller (future-proof rule): denied (`403`).

## 4) Functional Scope

### 4.1 Employee Data Management
- Create/read/update/delete (soft delete) employee records.
- Required attributes:
  - `employee_code`
  - `full_name`
  - `job_title`
  - `country_code`
  - `salary_cents`
  - `employment_type`
  - `effective_from`
  - `status`

### 4.2 Search/Filter/Listing
- Pagination with `page` + `per_page`.
- Sorting by `full_name`, `country_code`, `job_title`, `salary_cents`, `updated_at`.
- Filtering by `country_code`, `job_title`, `department`, `status`, salary min/max.
- Search by `full_name` and `employee_code`.
- Deterministic order rule: use requested sort + fallback `id ASC`.

### 4.3 Compensation Insights
- Country-level metrics: `min`, `max`, `avg`, `median`, `stddev`, `count`, `computed_at`.
- Country+job-title metrics: `min`, `max`, `avg`, `median`, `p25`, `p75`, `p90`, `count`, `computed_at`.
- Cross-segment distribution buckets using configurable ranges.

### 4.4 Data Import and Seeding
- Generate/load 10k+ employees in batches.
- Seed/bootstrap one HR manager user.
- Seed/generate exactly 10,000 employees for baseline environments.
- Use `first_names.txt` and `last_names.txt`.
- Idempotent upsert behavior keyed by `employee_code`.
- Deterministic mode supported with fixed seed.
- Log runtime, throughput, created/updated/skipped/failed counts.

## 5) Validation Rules

| Field | Type | Required | Rules | Error Message |
|---|---|---:|---|---|
| `employee_code` | string | Yes | unique, format `^EMP-[0-9]{4,}$`, max 32 | `employee_code must be unique and match EMP-XXXX format` |
| `full_name` | string | Yes | trimmed, length 2..120 | `full_name is required` |
| `job_title` | string | Yes | trimmed, length 2..120 | `job_title is required` |
| `country_code` | string | Yes | ISO 3166-1 alpha-2 uppercase | `country_code must be a valid ISO alpha-2 code` |
| `employment_type` | enum | Yes | `full_time`, `part_time`, `contractor` | `employment_type is not included in the list` |
| `effective_from` | date | Yes | must be valid date, not after today | `effective_from must be a valid current or past date` |
| `status` | enum | Yes | `active`, `inactive`, `terminated` | `status is not included in the list` |
| `department` | string | No | length <= 100 | `department is too long` |
| `hire_date` | date | No | cannot be in future | `hire_date cannot be in the future` |
| `last_salary_review_date` | date | No | cannot be before `hire_date` when both present | `last_salary_review_date cannot be before hire_date` |

## 6) API Error Contract

### Standard Error Envelope
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "salary_cents", "message": "must be greater than 0" }
    ],
    "request_id": "6f4cc51f-7c50-4f7e-a52c-1fcd6f46065b"
  }
}
```

### Status and Error Codes
- `400`: `BAD_REQUEST` (malformed query or invalid pagination format)
- `401`: `UNAUTHENTICATED`
- `403`: `FORBIDDEN`
- `404`: `EMPLOYEE_NOT_FOUND`
- `409`: `DUPLICATE_EMPLOYEE_CODE`
- `422`: `VALIDATION_ERROR`
- `500`: `INTERNAL_ERROR` (sanitized)

## 7) Gherkin Scenarios

```gherkin
Feature: Salary Management API for HR Manager

  Background:
    Given the API base path is "/api/v1"
    And responses include a "request_id"

  Scenario: HR Manager creates employee successfully
    Given I am authenticated as "hr_manager"
    When I POST "/employees" with valid employee attributes
    Then the response status is 201
    And the response contains "id", "employee_code", "created_at", and "updated_at"

  Scenario: Create fails for invalid salary and missing required fields
    Given I am authenticated as "hr_manager"
    When I POST "/employees" with salary_amount 0 and missing full_name
    Then the response status is 422
    And the error code is "VALIDATION_ERROR"
    And field-level errors include "salary_amount" and "full_name"
    And no employee record is created

  Scenario: Duplicate employee_code is rejected
    Given I am authenticated as "hr_manager"
    And an employee exists with employee_code "EMP-1001"
    When I POST "/employees" with employee_code "EMP-1001"
    Then the response status is 409
    And the error code is "DUPLICATE_EMPLOYEE_CODE"

  Scenario: Listing is deterministic with filters and sorting
    Given I am authenticated as "hr_manager"
    And 10000 employee records exist
    When I GET "/employees?country_code=IN&sort=salary_amount&direction=desc&page=1&per_page=50"
    Then the response status is 200
    And the response contains 50 records
    And records are sorted by salary_amount desc and id asc as tiebreaker

  Scenario: Invalid sort field is rejected
    Given I am authenticated as "hr_manager"
    When I GET "/employees?sort=invalid_column"
    Then the response status is 422
    And the error code is "VALIDATION_ERROR"

  Scenario: Soft delete hides employee from active results
    Given I am authenticated as "hr_manager"
    And employee "EMP-2001" exists
    When I DELETE "/employees/EMP-2001"
    Then the response status is 204
    When I GET "/employees?employee_code=EMP-2001"
    Then the response contains zero active records

  Scenario: Country insights return required metrics
    Given I am authenticated as "hr_manager"
    And salary data exists for country "US"
    When I GET "/insights/countries?country_code=US"
    Then the response status is 200
    And the response includes "min", "max", "avg", "median", "stddev", "count", and "computed_at"

  Scenario: Segment insights return percentile metrics
    Given I am authenticated as "hr_manager"
    And salary data exists for country "IN" and job title "Software Engineer"
    When I GET "/insights/segments?country_code=IN&job_title=Software%20Engineer"
    Then the response status is 200
    And the response includes "p25", "p75", "p90", "avg", "median", "min", "max", and "count"

  Scenario: Unauthenticated caller cannot access employees endpoint
    Given I am not authenticated
    When I GET "/employees"
    Then the response status is 401
    And the error code is "UNAUTHENTICATED"

  Scenario: Deterministic import is idempotent
    Given deterministic import mode is enabled with seed "42"
    And source data has 10000 rows
    When I run employee import twice
    Then duplicate employee_code records are not created
    And the second run reports non-zero skipped or updated counts
```

## 8) Data Model and Database Changes

### Affected Model
- `User`
- `Employee`

### User Schema
- `id`
- `email` (unique)
- `password_digest` (or framework-managed credential storage)
- `role` (string, current value: `hr_manager`)
- `created_at`
- `updated_at`

### Core Schema
- `id`
- `employee_code` (unique)
- `full_name`
- `job_title`
- `department` (nullable)
- `country_code`
- `salary_cents`
- `employment_type`
- `status`
- `effective_from`
- `hire_date` (nullable)
- `last_salary_review_date` (nullable)
- `deleted_at` (nullable)
- `created_at`
- `updated_at`

### Indexes
- unique index on `users.email`
- index on `users.role`
- unique index on `employee_code`
- index on `country_code`
- index on `job_title`
- index on `status`
- composite index on (`country_code`, `job_title`)
- composite index on (`country_code`, `salary_cents`)
- index on `deleted_at`

## 9) Detailed Commit Plan (single objective per commit)

### Commit 1: `feat(auth): implement API auth with generated authentication + JWT + hr_manager role`
- Objective: implement API-only authentication using Rails generated authentication as baseline, add JWT issuance/verification, and enforce role-based access using `users.role` (string) with `hr_manager` allowed.
- Key files: auth-generated models/controllers/migrations, JWT service/concern, base API auth guard, policy glue.
- Test scope: request specs for authenticated, unauthenticated (`401`), and forbidden (`403`) flows.
- Size target: 220-420 LOC.

### Commit 2: `feat(db): add employees table with core columns`
- Objective: introduce `employees` table with required/optional attributes and timestamps.
- Key files: migration, `db/schema.rb`.
- Test scope: migration/schema expectations.
- Size target: 80-160 LOC.

### Commit 3: `feat(db): add indexes and uniqueness constraints`
- Objective: add unique index on `employee_code` and supporting query indexes (`country_code`, `job_title`, `status`, composites, `deleted_at`).
- Key files: migration, `db/schema.rb`.
- Test scope: migration/index coverage checks.
- Size target: 60-140 LOC.

### Commit 4: `test(model): add Employee validation and enum specs`
- Objective: write failing model specs for required fields, formats, enums, and date consistency rules.
- Key files: `spec/models/employee_spec.rb`, factories.
- Test scope: model specs only (RED phase).
- Size target: 120-220 LOC.

### Commit 5: `feat(model): implement Employee validations and normalization`
- Objective: add validations, enum definitions, normalization callbacks, and base scopes.
- Key files: `app/models/employee.rb`.
- Test scope: make Commit 4 specs pass (GREEN phase).
- Size target: 80-180 LOC.

### Commit 6: `feat(model): add soft-delete behavior and active scope`
- Objective: implement `deleted_at` semantics and ensure default active-record access pattern.
- Key files: `app/models/employee.rb`, model spec updates.
- Test scope: soft-delete behavior and active filtering specs.
- Size target: 60-140 LOC.

### Commit 7: `test(query): add employee listing query specs`
- Objective: define failing specs for filters, search, sorting, pagination, and deterministic tie-break ordering.
- Key files: `spec/queries/employees/search_query_spec.rb` (or equivalent), factories.
- Test scope: query specs only (RED phase).
- Size target: 140-240 LOC.

### Commit 8: `feat(query): implement employee listing query object`
- Objective: build query object supporting filter/search/sort/pagination with fallback `id ASC` ordering.
- Key files: `app/queries/employees/search_query.rb` (or equivalent).
- Test scope: make Commit 7 specs pass (GREEN phase).
- Size target: 100-220 LOC.

### Commit 9: `feat(api): add auth guardrails and standard error envelope`
- Objective: wire authentication/authorization failure mapping and consistent error response contract with `request_id`.
- Key files: base API controller, error serializers/handlers, policy glue.
- Test scope: request specs for `401`, `403`, `422`, `404`, `409` mappings.
- Size target: 140-260 LOC.

### Commit 10: `feat(api): implement employees index and show endpoints`
- Objective: expose read APIs with policy checks, query integration, and stable response shapes.
- Key files: `app/controllers/api/v1/employees_controller.rb`, presenters/serializers, routes.
- Test scope: request specs for read endpoints and deterministic listing.
- Size target: 140-260 LOC.

### Commit 11: `feat(service): implement employee create/update services and endpoints`
- Objective: add transactional create/update flows with duplicate-code handling and validation error mapping.
- Key files: employee services, controller actions, strong params.
- Test scope: service + request specs for `create`/`update` success and failure paths.
- Size target: 200-340 LOC.

### Commit 12: `feat(api): implement soft-delete destroy endpoint`
- Objective: implement `DELETE /employees/:employee_code` as soft delete and hide deleted records from reads.
- Key files: controller destroy action, model/service support, routes/specs.
- Test scope: request + model/service specs for delete semantics.
- Size target: 80-180 LOC.

### Commit 13: `test(insights): add failing specs for country/segment/distribution analytics`
- Objective: codify required metrics (`min/max/avg/median/stddev/pXX/count/computed_at`) in request/query specs.
- Key files: `spec/requests/api/v1/insights/*`, query specs.
- Test scope: analytics specs only (RED phase).
- Size target: 140-260 LOC.

### Commit 14: `feat(insights): implement analytics queries and endpoints`
- Objective: deliver country, segment, and distribution insights with timestamped outputs.
- Key files: insight queries, controller endpoints, presenters, routes.
- Test scope: make Commit 13 specs pass (GREEN phase).
- Size target: 220-380 LOC.

### Commit 15: `feat(seed): seed hr_manager user and 10000 employees`
- Objective: add one seed/generator step that creates at least one HR manager user and generates 10,000 employees, with deterministic and idempotent behavior.
- Key files: `db/seeds.rb`, import/generator services, rake task/command entrypoint.
- Test scope: seed/import service specs for idempotency, deterministic output, and expected record counts.
- Size target: 180-340 LOC.

### Commit 16: `feat(import): add deterministic idempotent employee import`
- Objective: implement batch upsert import keyed by `employee_code`, deterministic seed mode, and run statistics logging.
- Key files: import/generator services, rake task/command entrypoint.
- Test scope: service specs for idempotency, deterministic output, counters.
- Size target: 180-320 LOC.

### Commit 17: `docs(api): finalize readiness checks and contract documentation`
- Objective: add readiness endpoint coverage and complete API documentation/examples aligned with final error/response shapes.
- Key files: readiness controller/route/specs, docs.
- Test scope: readiness request specs and doc verification.
- Size target: 80-180 LOC.

## 10) Testing Strategy
- Model specs: validations, enums, normalization, soft-delete behavior.
- Query specs: filter/sort/pagination correctness and deterministic ordering.
- Service specs: create/update transactionality, import/seed idempotency, deterministic generation.
- Request specs: auth behavior (JWT + role checks), CRUD, insights contracts, error envelope shape.
- Performance checks: list and insights request performance with 10k+ dataset.

## 11) Security and Reliability Checklist
- [ ] Auth required for all `/api/v1` routes in scope
- [ ] policies applied to each controller action
- [ ] Strong params whitelist for write actions
- [ ] No SQL interpolation in query objects
- [ ] Standard sanitized error envelope in all failures
- [ ] Health and readiness endpoints exposed

# Salary Management Frontend: Refined Feature Spec and Implementation Plan

## 1) Feature Summary
- **Complexity:** Large
- **Primary persona:** `HR Manager` (single persona)
- **Purpose:** Deliver a production-usable UI to manage employee salary records and consume salary insights at organizational scale.
- **Value proposition:** HR Manager can complete employee lifecycle operations and compensation analysis from one responsive, accessible interface.
- **Frontend stack:** Next.js 16 (App Router), React 19, TypeScript strict mode, Tailwind CSS v4.
- **Theme direction:** Clean, professional, dashboard-first, minimal, and classic.

## 2) Measurable Success Criteria (Definition of Done)
1. Login, token refresh, and logout flows work end-to-end with no manual token recovery.
2. Employee create/read/update/delete flows are fully functional from UI and correctly reflect API outcomes.
3. Directory supports server-side pagination, sorting, and filtering at 10,000+ records without loading all rows client-side.
4. Employee list interactions (`search`, `filter`, `sort`, `page`) maintain responsive UX
5. Country, segment, and distribution insights render required metrics including `computed_at`.
6. Form and query validation errors are shown as actionable field-level messages.
7. Core pages are mobile responsive, and include deterministic loading/empty/error/success states.
8. Frontend test suite covers critical journeys: auth, employee CRUD, and insights consumption.

## 3) Persona and Authorization Scope

### Persona: HR Manager
- Can access all in-scope screens.
- Can create, view, update, and soft-delete employee records.
- Can run country-level and segment-level compensation analysis.

### Authorization Rules
- Unauthenticated user: denied access to protected routes; redirected to login.
- `401 UNAUTHENTICATED`: attempt one refresh; if refresh fails, clear session and redirect to login.
- `403 FORBIDDEN`: show explicit permission-denied page.
- Current supported role for protected UI behavior: `hr_manager`.

## 4) Functional Scope

### 4.1 Authentication and Session UX
- Screen: `/(auth)/login`.
- Integrate with:
  - `POST /api/v1/session` (login)
  - `POST /api/v1/session/refresh` (rotate token pair)
  - `DELETE /api/v1/session` (logout)
- Implement refresh mutex (single-flight) to avoid multi-request refresh token reuse races.
- Persist auth state safely (access token in memory; refresh token via secure strategy aligned to deployment model).

### 4.2 Employee Directory
- Screen: `/employees`.
- Server-driven table/list with:
  - pagination: `page`, `per_page`
  - sorting: `sort_by`, `sort_direction`
  - filters: `country_code`, `job_title`, `department`, `status`, `salary_min`, `salary_max`
  - search: `search` (name/code)
- Provide predictable states: loading skeletons, empty results, API failure fallback.

### 4.3 Employee Create/Edit Form
- Screens: `/employees/new`, `/employees/[employee_code]/edit`.
- Required fields:
  - `employee_code`, `full_name`, `job_title`, `country_code`, `salary`, `employment_type`, `effective_from`, `status`
- Optional fields:
  - `department`, `hire_date`, `last_salary_review_date`
- Use nested payload contract: `{ employee: { ... } }`.
- Map backend `details[]` field errors to corresponding UI controls.

### 4.4 Employee Detail View
- Screen: `/employees/[employee_code]`.
- Render full employee data from show endpoint.
- Handle `404 EMPLOYEE_NOT_FOUND` with actionable return-to-list state.

### 4.5 Employee Soft Delete
- Trigger delete from row/detail actions with confirmation modal.
- On success (`204`), remove employee from list and show success feedback.
- Handle deleted/not-found retries gracefully.

### 4.6 Salary Insights Dashboard
- Screen: `/insights`.
- Country metrics from `/api/v1/insights/countries`:
  - `min`, `max`, `avg`, `median`, `stddev`, `count`, `computed_at`
- Segment metrics from `/api/v1/insights/segments`:
  - `min`, `max`, `avg`, `median`, `p25`, `p75`, `p90`, `count`, `computed_at`
- Distribution metrics from `/api/v1/insights/distributions`:
  - `bucket_size`, `buckets`, `top_countries`, `bottom_countries`, `computed_at`
- Include no-data states when aggregates are null/empty.

### 4.7 System Feedback and Error UX
- Unified error handler for API envelope:
  - `400 BAD_REQUEST`
  - `401 UNAUTHENTICATED`
  - `403 FORBIDDEN`
  - `404 EMPLOYEE_NOT_FOUND`
  - `409 DUPLICATE_EMPLOYEE_CODE`
  - `422 VALIDATION_ERROR`
  - `429 RATE_LIMITED`
- Show request trace identifier where available for diagnostics.

## 5) API Integration Contract for Frontend

### Employees Endpoints
- `GET /api/v1/employees`
  - query: `page`, `per_page`, `country_code`, `job_title`, `department`, `status`, `salary_min`, `salary_max`, `search`, `sort_by`, `sort_direction`
  - response: `{ data: Employee[], meta: PaginationMeta }`
- `GET /api/v1/employees/:employee_code`
  - response: `{ data: Employee }`
- `POST /api/v1/employees`
  - body: `{ employee: EmployeeInput }`
  - response: `{ data: Employee }`
- `PATCH /api/v1/employees/:employee_code`
  - body: `{ employee: Partial<EmployeeInput> }`
  - response: `{ data: Employee }`
- `DELETE /api/v1/employees/:employee_code`
  - response: `204 No Content`

### Session Endpoints
- `POST /api/v1/session`
  - body: `{ email, password }`
  - response: `{ access_token, refresh_token }`
- `POST /api/v1/session/refresh`
  - body: `{ refresh_token }`
  - recommended header: `Authorization: Bearer <access_token>`
  - response: rotated `{ access_token, refresh_token }`
- `DELETE /api/v1/session`
  - body/query: `{ refresh_token }`
  - header: `Authorization: Bearer <access_token>`
  - response: `204 No Content`

### Contract Notes
- Login expects `email` key (not `email_address`).
- Money values in responses are dollars (`salary` float), not cents.
- Backend validation details may reference internal names (`salary_cents`); frontend maps to display field (`salary`).
- Keep frontend query naming aligned to backend (`sort_by`/`sort_direction`).

## 6) UX and Interaction Requirements

### Visual Theme Direction
- Theme must remain clean, professional, dashboard-oriented, minimal, and classic across all screens.
- Use a restrained color palette with strong information hierarchy and high readability for dense tabular data.
- Prefer simple, consistent spacing, typography, and component styling over decorative effects.
- Prioritize clarity of data, action affordances, and decision-making speed for HR workflows.

### Core Screens
- Login
- Employee Directory
- Employee Create/Edit Form
- Employee Details
- Salary Insights Dashboard (country, segment, distribution)

### Interaction States
- Loading: skeletons/placeholders, action-level spinners.
- Empty: contextual empty states with clear next action.
- Error: page-level banner plus field-level messages when applicable.
- Success: non-blocking toast/snackbar plus persisted UI updates.

### Accessibility and Responsive
- Keyboard-accessible controls and semantic markup across forms/tables.
- `aria-live` for async success/error announcements.
- Desktop table-first layout; mobile card/list layout with filter drawer.
- Maintain functional parity between desktop and mobile.

## 7) Frontend Architecture Plan
- `app/` route segments for auth, employees, and insights.
- `lib/api/` typed API client and endpoint wrappers.
- `lib/auth/` token lifecycle manager and guarded fetch helper.
- `components/employees/*` for list/detail/form flows.
- `components/insights/*` for metrics views.
- `components/shared/*` for table, form inputs, pagination, toasts, state shells.
- `types/` for DTOs and UI model mapping.
- `hooks/` for query/filter/form orchestration.

## 8) Detailed Commit Plan (single objective per commit)

### Commit 1: `chore(frontend): set up app shell and route structure`
- Objective: establish route groups, metadata, layout scaffolding, shared UI primitives, and foundational theme tokens (clean, professional, dashboard-first, minimal, classic).
- Key files: `frontend/app/layout.tsx`, route folders, shared components.
- Test scope: lint + typecheck baseline.
- Size target: 120-220 LOC.

### Commit 2: `feat(auth): implement login flow with API session endpoint`
- Objective: add login form, validation, and token acquisition from `/api/v1/session`.
- Key files: auth page, API client, auth store/helper.
- Test scope: unit tests for form validation and login success/failure mapping.
- Size target: 160-280 LOC.

### Commit 3: `feat(auth): add refresh rotation and protected route guard`
- Objective: implement `401` recovery with single-flight refresh and protected navigation.
- Key files: auth fetch wrapper, refresh lock utility, route guard logic.
- Test scope: integration tests for refresh retry and forced logout fallback.
- Size target: 180-320 LOC.

### Commit 4: `feat(employees): implement directory with server pagination`
- Objective: render `/employees` list with API-backed pagination and meta.
- Key files: employee list page, table component, pagination controls.
- Test scope: loading/empty/populated rendering tests.
- Size target: 180-320 LOC.

### Commit 5: `feat(employees): implement filter, search, and sort controls`
- Objective: add API query-state driven filtering/sorting/search.
- Key files: filters toolbar, query param utils, list integration.
- Test scope: query serialization/deserialization and API param mapping tests.
- Size target: 180-300 LOC.

### Commit 6: `feat(employees): add employee detail screen`
- Objective: implement `/employees/[employee_code]` with resilient error states.
- Key files: detail page, employee summary components.
- Test scope: success and not-found UI behavior.
- Size target: 120-220 LOC.

### Commit 7: `feat(employees): add create employee workflow`
- Objective: implement create form with nested payload and backend validation mapping.
- Key files: form components, create page/action handlers.
- Test scope: form submission success, 422 validation mapping, 409 duplicate code handling.
- Size target: 220-360 LOC.

### Commit 8: `feat(employees): add update employee workflow`
- Objective: implement edit form with prefilled values and update submission.
- Key files: edit page, form reuse paths, update handlers.
- Test scope: update success and failure path coverage.
- Size target: 180-320 LOC.

### Commit 9: `feat(employees): implement soft-delete interaction`
- Objective: add delete confirmation and post-delete UI consistency.
- Key files: row actions, confirmation modal, list/detail invalidation logic.
- Test scope: delete success and `404` fallback tests.
- Size target: 100-200 LOC.

### Commit 10: `feat(insights): implement country and segment metrics views`
- Objective: build primary insights dashboard widgets and filters.
- Key files: insights page, metrics cards, filter controls.
- Test scope: response rendering and no-data behavior.
- Size target: 220-360 LOC.

### Commit 11: `feat(insights): implement salary distribution view`
- Objective: add bucket-size driven distribution visualization and top/bottom country bands.
- Key files: distribution module, chart/list components, bucket control.
- Test scope: parameter handling and rendering correctness tests.
- Size target: 180-320 LOC.

### Commit 12: `feat(ui): standardize global error and feedback system`
- Objective: unify API error parsing, toasts, request-id surfacing, and shared visual treatment aligned to the theme.
- Key files: shared error presenter, toast provider, API client interceptors.
- Test scope: error mapping tests by status code.
- Size target: 140-260 LOC.

### Commit 13: `feat(a11y): improve keyboard and responsive interactions`
- Objective: ensure accessibility, parity across desktop/mobile, and strict visual conformance to the clean/professional/dashboard/minimal/classic theme across all core screens.
- Key files: focus management, aria labels, responsive layout refinements.
- Test scope: accessibility smoke checks and responsive interaction tests.
- Size target: 120-240 LOC.

### Commit 14: `test(e2e): add critical HR manager journey coverage`
- Objective: add end-to-end tests for login, employee CRUD, and insights.
- Key files: e2e specs and helper fixtures.
- Test scope: deterministic critical-path e2e suite.
- Size target: 180-340 LOC.

## 9) Testing Strategy
- Unit tests: form validation, mappers, query-state helpers, auth token utilities.
- Integration tests: page-level data fetching and mutation flows.
- E2E tests: login, directory operations, create/update/delete, and insights scenarios.
- Quality gates: `npm run lint`, type checks, production build, and performance smoke checks.

## 10) Security, Reliability, and Performance Checklist
- [ ] All protected pages require authenticated session.
- [ ] API requests include bearer token where required.
- [ ] Refresh logic is race-safe and token rotation aware.
- [ ] `401/403/404/409/422/429` are mapped to explicit UX states.
- [ ] Field-level validation from backend is shown consistently.
- [ ] No sensitive token values logged to console or telemetry.
- [ ] Directory operations remain server-driven for 10k+ records.
- [ ] All insights views display `computed_at` timestamp.
- [ ] All core screens conform to clean, professional, dashboard-first, minimal, classic visual standards.

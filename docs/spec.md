# Salary Management System

## 1. Product Overview

The Salary Management System is an internal HR platform for managing employee compensation data at organizational scale.
It enables HR teams to maintain accurate employee salary records, analyze compensation patterns across countries and job titles,
and make informed compensation decisions using rea -time insights.

The system is designed for production use in organizations with at least 10,000 employees and is built to support data correctness,
operational reliability, performance, and maintainability.

## 2. Product Goals

- Provide a reliable and auditable source of truth for employee salary records.
- Enable fast, accurate compensation analytics for operational and strategic HR decisions.
- Ensure safe and efficient CRUD workflows for employee lifecycle changes.
- Deliver strong operational quality through validation, observability, and testing.
- Support scalable performance for high-volume read operations and bulk data loading.

## 3. Personas and Use Cases

### Primary Persona: HR Manager

Responsibilities:
- Manage employee master records including compensation metadata.
- Review salary benchmarks by country and role.
- Detect outliers and assess compensation fairness.
- Provide reports to leadership and finance stakeholders.


## 4. Functional Scope

## 4.1 Employee Data Management

The system must support full employee record lifecycle management:

- Create employee records.
- Read employee records (single and list).
- Update employee records.
- Delete employee records (soft delete preferred for auditability).

### Required Employee Attributes

- `employee_code` (system-unique business identifier)
- `full_name`
- `job_title`
- `country_code` (ISO 3166-1 alpha-2)
- `salary_amount` (annualized, positive)
- `currency_code` (ISO 4217)
- `employment_type` (e.g., full_time, part_time, contractor)
- `effective_from` (date from which current salary applies)
- `status` (active, inactive, terminated)

### Recommended Additional Attributes

- `department`
- `manager_name` or `manager_id`
- `location`
- `hire_date`
- `last_salary_review_date`

### Record Integrity Rules

- Mandatory fields must be present.
- Salary must be numeric and greater than zero.
- Country and currency must match accepted code formats.
- Invalid updates must fail atomically with actionable error messages.
- Duplicate `employee_code` values must be blocked.

## 4.2 Search, Filter, and Listing

Employee listing must support:

- Pagination (offset/limit or cursor-based).
- Sorting by key fields (name, country, job_title, salary, updated_at).
- Filtering by country, job title, department, status, and salary range.
- Name and employee code search.


## 4.3 Compensation Insights

The system must provide analytics that HR can consume directly.

### Country-Level Insights

For a selected country (and optional filters):

- Minimum salary
- Maximum salary
- Average salary
- Median salary
- Employee count
- Standard deviation (for spread understanding)

### Country + Job Title Insights

For selected country and job title:

- Average salary
- Median salary
- Min/Max salary
- Employee count
- Percentile points (p25, p75, p90)

### Cross-Segment Insights

- Top and bottom salary bands by country.
- Job title comparison across countries.
- Distribution buckets (configurable ranges).

### Insight Freshness

- Insights are computed from live data for correctness, or
- materialized with a defined refresh SLA when optimization is required.

All endpoints must clearly indicate timestamp of computed data.

## 4.4 Data Import and Seeding

The system must support generating and loading 10,000+ employee records efficiently.

Requirements:

- Name generation from `first_names.txt` and `last_names.txt`.
- Bulk insertion using batched operations.
- Idempotent execution (safe to run repeatedly).
- Deterministic mode for repeatable test environments.
- Runtime and throughput logging.

## 4.5 Error Handling and Validation UX

API and UI must provide clear, field-level validation errors.

Error response envelope must include:

- stable error code
- human-readable message
- field-level details when applicable
- trace/request identifier for diagnostics

## 5. Non-Functional Requirements

## 5.1 Performance

- Employee list queries should remain fast at 10,000+ records with standard filters.
- Aggregation endpoints should be index aware and performant under concurrent use.
- Bulk data load operations must avoid N+1 inserts and memory-heavy patterns.

## 5.2 Scalability

- Data model and API contract should support growth beyond current data volume.
- Read-heavy workloads should be optimized through indexing and query planning.
- Architecture should allow future introduction of caching and asynchronous pipelines.

## 5.3 Reliability and Availability

- Service should fail gracefully and preserve data consistency.
- Critical write operations must be transactional.
- Health endpoints and readiness checks must be exposed.

## 5.4 Maintainability

- Clear separation of concerns across domain, transport, and persistence layers.
- Consistent coding standards and linting.
- Deterministic, fast, and isolated automated tests.

## 6. Data Model Specification

## 6.1 Core Entity: Employee

Canonical schema:

- `id` (UUID or bigint primary key)
- `employee_code` (unique)
- `full_name`
- `job_title`
- `department` (nullable)
- `country_code`
- `currency_code`
- `salary_amount`
- `employment_type`
- `status`
- `effective_from`
- `hire_date` (nullable)
- `last_salary_review_date` (nullable)
- `created_at`
- `updated_at`
- `deleted_at` (nullable, for soft delete)

## 6.2 Indexing Strategy

Required indexes:

- unique index on `employee_code`
- index on `country_code`
- index on `job_title`
- index on `status`
- composite index on (`country_code`, `job_title`)
- index on (`country_code`, `salary_amount`) for country stats


## 7. API Specification

Base path: `/api/v1`


## 8. UX and UI Specification

## 8.1 Core Screens

- Employee Directory
- Employee Create/Edit Form
- Salary Insights Dashboard
- Comparisons and Distribution Views

## 8.2 Interaction Requirements

- Form validation with immediate user feedback.
- Keyboard-accessible controls and semantic markup.
- Responsive behavior for desktop and mobile breakpoints.
- Loading placeholders and non-blocking asynchronous updates.
- Predictable empty/error/success states.

## 9. Reporting and Export Readiness

The system should support export-ready outputs for HR workflows:

- CSV export for filtered employee lists.
- CSV export for insight snapshots.

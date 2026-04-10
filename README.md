# Salary Management System

Monorepo for a salary management app with:
- `backend/` -> Rails 8 JSON API
- `frontend/` -> Next.js 16 + React 19 UI

## Project Setup

### Prerequisites

- Ruby `4.0.0`
- Node.js `22+`
- PostgreSQL `14+` (or compatible)


### 1) Setup backend

```bash
cd backend
bin/rails db:prepare
bin/rails employees:seed
bin/rails server
```

Backend API base URL: `http://localhost:3000/api/v1`

### 3) Start frontend

Run frontend on a different port (recommended):

```bash
cd frontend
npm run dev -- --port 3001
```

Frontend URL: `http://localhost:3001`

## Seed Data

The backend seed creates:
- 1 HR manager user: `hr_manager@example.com` / `password123`
- Exactly `10,000` employees

You can safely re-run:

```bash
cd backend
bin/rails employees:seed
# or
bin/rails db:seed
```

Seed behavior is deterministic and idempotent.

## API Examples (cURL)

### 1) Login and get tokens

```bash
curl -X POST "http://localhost:3000/api/v1/session" \
  -H "Content-Type: application/json" \
  -d '{"email":"hr_manager@example.com","password":"password123"}'
```

Use `access_token` and `refresh_token` from the response.

### 2) List employees with pagination

```bash
curl -X GET "http://localhost:3000/api/v1/employees?page=1&per_page=5" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### 3) List employees with filters and sorting

```bash
curl -X GET "http://localhost:3000/api/v1/employees?country_code=IN&status=active&search=sharma&sort_by=salary_cents&sort_direction=desc" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### 4) Get one employee by `employee_code`

```bash
curl -X GET "http://localhost:3000/api/v1/employees/EMP-0001" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### 5) Create employee

```bash
curl -X POST "http://localhost:3000/api/v1/employees" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "employee": {
      "employee_code": "EMP-10001",
      "full_name": "Aarav Sharma",
      "job_title": "Software Engineer",
      "country_code": "IN",
      "employment_type": "full_time",
      "effective_from": "2026-01-01",
      "status": "active",
      "salary_cents": 12500000,
      "department": "Engineering",
      "hire_date": "2024-01-10",
      "last_salary_review_date": "2025-12-10"
    }
  }'
```

### 6) Update employee status

```bash
curl -X PATCH "http://localhost:3000/api/v1/employees/EMP-0001" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "employee": {
      "status": "inactive",
      "salary_cents": 13250000
    }
  }'
```

### 7) Insights endpoints

```bash
curl -X GET "http://localhost:3000/api/v1/insights/countries" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

curl -X GET "http://localhost:3000/api/v1/insights/segments" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

curl -X GET "http://localhost:3000/api/v1/insights/distributions" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### 8) Refresh token

```bash
curl -X POST "http://localhost:3000/api/v1/session/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<REFRESH_TOKEN>"}'
```

### 9) Logout (revoke refresh token)

```bash
curl -X DELETE "http://localhost:3000/api/v1/session" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<REFRESH_TOKEN>"}'
```

## Useful Commands

### Backend (`backend/`)

```bash
bundle exec rspec
bundle exec rubocop -a
bin/brakeman --no-pager
bundle exec bundler-audit check --update
```

### Frontend (`frontend/`)

```bash
npm run dev
npm run lint
npm run build
```

# Backend API

Rails 8 API for Salary Management System.

## Local Setup

```bash
bundle install
bin/rails db:prepare
bin/rails db:seed
bin/rails server
```

Default API base URL: `http://localhost:3000/api/v1`

## Seed Data

Seeding creates:
- 1 HR manager user (`hr_manager@example.com` / `password123`)
- exactly 10,000 employees

Run with either command:

```bash
bin/rails db:seed
```

The seed is deterministic and idempotent.

## API Testing With cURL

### 1) Login and get tokens

```bash
curl -X POST "http://localhost:3000/api/v1/session" \
  -H "Content-Type: application/json" \
  -d '{"email":"hr_manager@example.com","password":"password123"}'
```

Copy `access_token` and `refresh_token` from the response.

### 2) List employees

```bash
curl -X GET "http://localhost:3000/api/v1/employees?page=1&per_page=5" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

Optional filters:

```bash
curl -X GET "http://localhost:3000/api/v1/employees?country_code=IN&status=active&sort_by=salary_cents&sort_direction=desc" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### 3) Get one employee by employee_code

```bash
curl -X GET "http://localhost:3000/api/v1/employees/EMP-0001" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### 4) Refresh access token

```bash
curl -X POST "http://localhost:3000/api/v1/session/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<REFRESH_TOKEN>"}'
```

### 5) Logout (revoke refresh token)

```bash
curl -X DELETE "http://localhost:3000/api/v1/session" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<REFRESH_TOKEN>"}'
```

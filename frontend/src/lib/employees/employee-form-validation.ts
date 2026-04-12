import type { EmployeeFormErrors, EmployeeFormValues } from "../../app/(workspace)/employees/employee-form";

const EMPLOYEE_CODE_PATTERN = /^EMP-[0-9]{4,}$/;
const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;
const EMPLOYMENT_TYPES = new Set(["full_time", "part_time", "contractor"]);
const STATUSES = new Set(["active", "inactive", "terminated"]);

export const normalizeEmployeeFormValues = (values: EmployeeFormValues): EmployeeFormValues => ({
  fullName: values.fullName.trim(),
  employeeCode: values.employeeCode.trim().toUpperCase(),
  jobTitle: values.jobTitle?.trim() ?? "",
  country: values.country?.trim().toUpperCase() ?? "",
  department: values.department?.trim() ?? "",
  employmentType: values.employmentType?.trim() ?? "",
  salary: values.salary?.trim() ?? "",
  status: values.status?.trim() ?? "",
  effectiveFrom: values.effectiveFrom?.trim() ?? "",
  hireDate: values.hireDate?.trim() ?? "",
  lastSalaryReviewDate: values.lastSalaryReviewDate?.trim() ?? "",
});

export const validateEmployeeFormValues = (values: EmployeeFormValues): EmployeeFormErrors => {
  const errors: EmployeeFormErrors = {};

  if (!values.fullName || values.fullName.length < 2) {
    errors.fullName = "Full name must be at least 2 characters";
  }

  if (!values.employeeCode || !EMPLOYEE_CODE_PATTERN.test(values.employeeCode)) {
    errors.employeeCode = "Use EMP- followed by at least 4 digits";
  }

  if (!values.jobTitle || values.jobTitle.length < 2) {
    errors.jobTitle = "Job title must be at least 2 characters";
  }

  if (!values.country || !COUNTRY_CODE_PATTERN.test(values.country)) {
    errors.country = "Country must be a 2-letter ISO code";
  }

  if (values.department && values.department.length > 100) {
    errors.department = "Department must be 100 characters or less";
  }

  if (!values.employmentType || !EMPLOYMENT_TYPES.has(values.employmentType)) {
    errors.employmentType = "Select a valid employment type";
  }

  const salaryNumber = Number(values.salary);
  if (!values.salary || Number.isNaN(salaryNumber) || salaryNumber <= 0) {
    errors.salary = "Salary must be greater than 0";
  }

  if (!values.status || !STATUSES.has(values.status)) {
    errors.status = "Select a valid status";
  }

  if (!values.effectiveFrom) {
    errors.effectiveFrom = "Effective from is required";
  }

  const today = new Date().toISOString().slice(0, 10);
  if (values.effectiveFrom && values.effectiveFrom > today) {
    errors.effectiveFrom = "Effective from cannot be in the future";
  }

  if (values.hireDate && values.hireDate > today) {
    errors.hireDate = "Hire date cannot be in the future";
  }

  if (values.lastSalaryReviewDate && values.hireDate && values.lastSalaryReviewDate < values.hireDate) {
    errors.lastSalaryReviewDate = "Last salary review date cannot be before hire date";
  }

  return errors;
};

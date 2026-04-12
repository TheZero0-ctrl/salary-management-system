"use client";

import { type SubmitEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { getEmployeeByCode, updateEmployee } from "../../../../../lib/api/employees-client";
import { useProtectedRoute } from "../../../../../lib/auth/use-protected-route";
import {
  normalizeEmployeeFormValues,
  validateEmployeeFormValues,
} from "../../../../../lib/employees/employee-form-validation";
import { EmployeeForm, type EmployeeFormErrors } from "../../employee-form";

export default function EmployeeEditPage() {
  useProtectedRoute();
  const router = useRouter();
  const params = useParams<{ employee_code?: string }>();
  const employeeCodeFromRoute = params?.employee_code ?? "";
  const [fullName, setFullName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [country, setCountry] = useState("");
  const [department, setDepartment] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [salary, setSalary] = useState("");
  const [status, setStatus] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [lastSalaryReviewDate, setLastSalaryReviewDate] = useState("");
  const [fieldErrors, setFieldErrors] = useState<EmployeeFormErrors>({});
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadEmployee = async () => {
      const result = await getEmployeeByCode(employeeCodeFromRoute);

      if (result.kind !== "found") {
        return;
      }

      setFullName(result.employee.fullName ?? "");
      setEmployeeCode(result.employee.employeeCode ?? "");
      setJobTitle(result.employee.jobTitle ?? "");
      setCountry(result.employee.country ?? "");
      setDepartment(result.employee.department ?? "");
      setEmploymentType(result.employee.employmentType ?? "");
      setSalary(result.employee.salary === undefined ? "" : String(result.employee.salary));
      setStatus(result.employee.status ?? "");
      setEffectiveFrom(result.employee.effectiveFrom ?? "");
      setHireDate(result.employee.hireDate ?? "");
      setLastSalaryReviewDate(result.employee.lastSalaryReviewDate ?? "");
    };

    void loadEmployee();
  }, [employeeCodeFromRoute]);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setUpdateError(null);

    const normalizedValues = normalizeEmployeeFormValues({
      fullName,
      employeeCode,
      jobTitle,
      country,
      department,
      employmentType,
      salary,
      status,
      effectiveFrom,
      hireDate,
      lastSalaryReviewDate,
    });
    const clientValidationErrors = validateEmployeeFormValues(normalizedValues);

    if (Object.keys(clientValidationErrors).length > 0) {
      setFieldErrors(clientValidationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateEmployee(employeeCodeFromRoute, normalizedValues);

      if (result.kind === "updated") {
        router.push(`/employees/${employeeCodeFromRoute}`);
        return;
      }

      if (result.kind === "validation-error") {
        setFieldErrors(result.fieldErrors as EmployeeFormErrors);
        return;
      }

      if (result.kind === "duplicate-employee-code") {
        setUpdateError(result.message);
        return;
      }

      setUpdateError("Unable to update employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <EmployeeForm
      title="Edit employee"
      submitLabel="Save changes"
      values={{
        fullName,
        employeeCode,
        jobTitle,
        country,
        department,
        employmentType,
        salary,
        status,
        effectiveFrom,
        hireDate,
        lastSalaryReviewDate,
      }}
      errors={fieldErrors}
      formError={updateError}
      showDepartmentField
      showExtendedFields
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      onFullNameChange={setFullName}
      onEmployeeCodeChange={setEmployeeCode}
      onDepartmentChange={setDepartment}
      onJobTitleChange={setJobTitle}
      onCountryChange={setCountry}
      onEmploymentTypeChange={setEmploymentType}
      onSalaryChange={setSalary}
      onStatusChange={setStatus}
      onEffectiveFromChange={setEffectiveFrom}
      onHireDateChange={setHireDate}
      onLastSalaryReviewDateChange={setLastSalaryReviewDate}
    />
  );
}

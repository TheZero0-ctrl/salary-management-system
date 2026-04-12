"use client";

import { type SubmitEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createEmployee } from "../../../../lib/api/employees-client";
import { useProtectedRoute } from "../../../../lib/auth/use-protected-route";
import {
  normalizeEmployeeFormValues,
  validateEmployeeFormValues,
} from "../../../../lib/employees/employee-form-validation";
import { EmployeeForm, type EmployeeFormErrors } from "../employee-form";

export default function EmployeeCreatePage() {
  useProtectedRoute();
  const router = useRouter();
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
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setFormMessage(null);

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
      const result = await createEmployee(normalizedValues);

      if (result.kind === "created") {
        router.push(`/employees/${result.employeeCode}`);
        return;
      }

      if (result.kind === "validation-error") {
        setFieldErrors(result.fieldErrors as EmployeeFormErrors);
        return;
      }

      if (result.kind === "duplicate-employee-code") {
        setFormMessage(result.message);
        return;
      }

      setFormMessage("Unable to create employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <EmployeeForm
      title="Create employee"
      submitLabel="Create employee"
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
      formError={formMessage}
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

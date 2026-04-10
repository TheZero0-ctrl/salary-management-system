# frozen_string_literal: true

module ValidationPatterns
  COUNTRY_CODE = /\A[A-Z]{2}\z/
  EMPLOYEE_CODE = /\AEMP-[0-9]{4,}\z/
end

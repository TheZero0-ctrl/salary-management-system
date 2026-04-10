# frozen_string_literal: true

module MoneyAmount
  module_function

  def dollars_to_cents(value)
    (value.to_f * 100).round
  end

  def cents_to_dollars(value)
    return if value.nil?

    (value.to_f / 100).round(2)
  end
end

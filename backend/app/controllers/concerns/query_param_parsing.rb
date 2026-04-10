# frozen_string_literal: true

module QueryParamParsing
  class InvalidQueryParameter < StandardError
    attr_reader :field, :detail

    def initialize(field:, detail:)
      @field = field
      @detail = detail
      super("#{field} #{detail}")
    end
  end

  private

  INTEGER_FORMAT = /\A[+-]?\d+\z/

  def parse_integer_param(value, field:, min: nil)
    return nil if value.blank?

    raw = value.to_s.strip
    raise_invalid_query_param(field, "must be an integer") unless raw.match?(INTEGER_FORMAT)

    parsed = raw.to_i
    if min && parsed < min
      raise_invalid_query_param(field, "must be greater than or equal to #{min}")
    end

    parsed
  end

  def parse_money_to_cents_param(value, field:, min: nil)
    return nil if value.blank?

    parsed_cents = (value.to_f * 100).round

    if min && parsed_cents < min
      raise_invalid_query_param(field, "must be greater than or equal to #{min / 100}")
    end

    parsed_cents
  end

  def raise_invalid_query_param(field, detail)
    raise InvalidQueryParameter.new(field:, detail:)
  end
end

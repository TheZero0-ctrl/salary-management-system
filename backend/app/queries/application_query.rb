# frozen_string_literal: true

class ApplicationQuery
  def initialize(relation = nil)
    @relation = relation || default_relation
  end

  def call
    raise NotImplementedError
  end

  def self.call(...)
    new(...).call
  end

  private

  def default_relation
    raise NotImplementedError
  end
end

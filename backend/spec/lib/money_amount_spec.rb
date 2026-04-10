# frozen_string_literal: true

require "rails_helper"

RSpec.describe MoneyAmount do
  describe ".dollars_to_cents" do
    it "converts dollars to cents" do
      expect(described_class.dollars_to_cents(1000)).to eq(100_000)
    end
  end

  describe ".cents_to_dollars" do
    it "converts cents to dollars" do
      expect(described_class.cents_to_dollars(100_050)).to eq(1000.5)
    end

    it "returns nil for nil input" do
      expect(described_class.cents_to_dollars(nil)).to be_nil
    end
  end
end

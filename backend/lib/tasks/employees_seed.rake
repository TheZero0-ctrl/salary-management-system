# frozen_string_literal: true

namespace :employees do
  desc "Seed one HR manager and exactly 10,000 employees"
  task seed: :environment do
    Seeding::BootstrapService.call
  end
end

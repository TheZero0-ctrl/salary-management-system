# frozen_string_literal: true

module PaginationParams
  extend ActiveSupport::Concern

  DEFAULT_PAGE = 1
  DEFAULT_PER_PAGE = 12
  MAX_PER_PAGE = 50

  private

  def pagination_params
    [ page_param, per_page_param ]
  end

  def page_param
    normalized_integer_param(params[:page], min: 1) || DEFAULT_PAGE
  end

  def per_page_param
    per_page = normalized_integer_param(params[:per_page], min: 1) || DEFAULT_PER_PAGE
    [ per_page, MAX_PER_PAGE ].min
  end

  def normalized_integer_param(value, min:)
    parsed_value = ActiveModel::Type::Integer.new.cast(value)
    return if parsed_value.nil?

    [ parsed_value, min ].max
  end

  def pagination_meta(pagy)
    {
      page: pagy.page,
      per_page: pagy.limit,
      total_count: pagy.count,
      total_pages: pagy.pages
    }
  end
end

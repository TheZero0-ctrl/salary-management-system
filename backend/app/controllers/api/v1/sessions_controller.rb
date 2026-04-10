# frozen_string_literal: true

module Api
  module V1
    class SessionsController < ApplicationController
      skip_before_action :authenticate_user!

      rate_limit to: 10, within: 3.minutes, only: :create,
                 by: -> { "#{request.remote_ip}:#{params[:email].to_s.strip.downcase}" },
                 with: -> { render json: { error: "Too many login attempts. Try again later." }, status: :too_many_requests }

      def create
        user = User.find_for_database_authentication(email_address: normalized_email)

        if user&.valid_password?(params[:password])
          render json: token_pair_for(user), status: :ok
        else
          head :unauthorized
        end
      end

      def refresh
        refresh_token = RefreshToken.find_active_by_token(params[:refresh_token])
        return head :unauthorized unless refresh_token

        user = refresh_token.user
        refresh_token.revoke!

        render json: token_pair_for(user), status: :ok
      end

      def destroy
        refresh_token = RefreshToken.find_active_by_token(params[:refresh_token])
        return head :unauthorized unless refresh_token

        refresh_token.revoke!
        head :no_content
      end

      private

      def normalized_email
        params[:email].to_s.strip.downcase
      end

      def token_pair_for(user)
        access_token, = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil)
        plain_refresh_token = RefreshToken.issue_for(user)

        {
          access_token: access_token,
          refresh_token: plain_refresh_token
        }
      end
    end
  end
end

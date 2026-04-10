# frozen_string_literal: true

module Api
  module V1
    class SessionsController < ApplicationController
      skip_before_action :require_authenticated_user

      rate_limit to: 10, within: 3.minutes, only: :create,
                 by: -> { "#{request.remote_ip}:#{params[:email].to_s.strip.downcase}" },
                 with: -> { render_error(:too_many_requests, "Too many login attempts. Try again later.", code: "RATE_LIMITED") }

      def create
        user = User.find_for_database_authentication(email_address: normalized_email)

        if user&.valid_password?(params[:password])
          render json: token_pair_for(user), status: :ok
        else
          render_error(:unauthorized, "Unauthorized", code: "UNAUTHENTICATED")
        end
      end

      def refresh
        refresh_token = RefreshToken.find_active_by_token(params[:refresh_token])
        return render_error(:unauthorized, "Unauthorized", code: "UNAUTHENTICATED") unless refresh_token

        user = refresh_token.user
        revoke_current_access_token
        refresh_token.revoke!

        render json: token_pair_for(user), status: :ok
      end

      def destroy
        return render_error(:unauthorized, "Unauthorized", code: "UNAUTHENTICATED") unless decoded_bearer_payload

        refresh_token = RefreshToken.find_active_by_token(params[:refresh_token])
        return render_error(:unauthorized, "Unauthorized", code: "UNAUTHENTICATED") unless refresh_token

        revoke_current_access_token
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

      def revoke_current_access_token
        payload = decoded_bearer_payload
        return unless payload

        RevokedAccessToken.revoke_payload!(payload)
      end
    end
  end
end

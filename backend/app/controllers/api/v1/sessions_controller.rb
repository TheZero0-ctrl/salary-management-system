# frozen_string_literal: true

module Api
  module V1
    class SessionsController < ApplicationController
      skip_before_action :require_authenticated_user

      rate_limit to: 10, within: 3.minutes, only: :create,
                 by: -> { "#{request.remote_ip}:#{params[:email].to_s.strip.downcase}" },
                 with: -> { render_api_error(:rate_limited) }

      def create
        user = User.find_for_database_authentication(email_address: normalized_email)

        if user&.valid_password?(params[:password])
          render json: token_pair_for(user), status: :ok
        else
          render_api_error(:unauthenticated)
        end
      end

      def refresh
        refresh_token = RefreshToken.find_active_by_token(params[:refresh_token])
        return render_api_error(:unauthenticated) unless refresh_token

        bearer_user = bearer_user_from_payload
        if bearer_token.present? && bearer_user.blank?
          return render_api_error(:unauthenticated)
        end
        if bearer_user.present? && refresh_token.user_id != bearer_user.id
          return render_api_error(:unauthenticated)
        end

        rotated_tokens = rotate_refresh_token(refresh_token)
        return render_api_error(:unauthenticated) if rotated_tokens.nil?

        render json: rotated_tokens, status: :ok
      end

      def destroy
        bearer_user = bearer_user_from_payload
        return render_api_error(:unauthenticated) if bearer_user.blank?

        refresh_token = RefreshToken.find_active_by_token(params[:refresh_token])
        return render_api_error(:unauthenticated) unless refresh_token
        return render_api_error(:unauthenticated) if refresh_token.user_id != bearer_user.id

        return render_api_error(:unauthenticated) unless revoke_session!(refresh_token)

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

      def bearer_user_from_payload
        payload = decoded_bearer_payload
        return if payload.blank?

        User.find_by(id: payload["sub"])
      end

      def rotate_refresh_token(refresh_token)
        new_tokens = nil
        token_still_active = true

        ActiveRecord::Base.transaction do
          refresh_token.lock!
          token_still_active = refresh_token.revoked_at.nil? && refresh_token.expires_at > Time.current
          raise ActiveRecord::Rollback unless token_still_active

          revoke_current_access_token
          refresh_token.revoke!
          new_tokens = token_pair_for(refresh_token.user)
        end

        token_still_active ? new_tokens : nil
      end

      def revoke_session!(refresh_token)
        token_still_active = true

        ActiveRecord::Base.transaction do
          refresh_token.lock!
          token_still_active = refresh_token.revoked_at.nil? && refresh_token.expires_at > Time.current
          raise ActiveRecord::Rollback unless token_still_active

          revoke_current_access_token
          refresh_token.revoke!
        end

        token_still_active
      end
    end
  end
end

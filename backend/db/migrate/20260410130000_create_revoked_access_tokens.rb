class CreateRevokedAccessTokens < ActiveRecord::Migration[8.1]
  def change
    create_table :revoked_access_tokens do |t|
      t.string :jti, null: false
      t.datetime :expires_at, null: false

      t.timestamps
    end

    add_index :revoked_access_tokens, :jti, unique: true
    add_index :revoked_access_tokens, :expires_at
  end
end

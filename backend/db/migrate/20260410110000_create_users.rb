class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :email_address, null: false
      t.string :encrypted_password, null: false, default: ""
      t.string :jti, null: false, default: ""
      t.string :role, null: false, default: "employee"

      t.timestamps
    end

    add_index :users, :email_address, unique: true
    add_index :users, :jti, unique: true
    add_index :users, :role
  end
end

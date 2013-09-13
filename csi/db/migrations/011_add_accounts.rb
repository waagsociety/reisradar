Sequel.migration do
up do
		create_table :account do
			primary_key :id
			String :username
			String :password
			timestamp :created_at, :null => false, :default => :now.sql_function
		end
		
		alter_table :account do
			add_index :username
		end
	end

	down do
		alter_table :account do
			drop_index :username
		end

		drop_table(:account)
	end
end

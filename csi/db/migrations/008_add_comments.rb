Sequel.migration do
	up do
		create_table :comments do
			primary_key :id
			Integer :intelligence_id #when this is not null, it's a comment on intelligence
			String :cdk_id
		        String :cdk_layer #when this is not null, it's a comment on open data	
			String :body, :null => false
			timestamp :created_at, :null => false, :default => :now.sql_function
		end
		
		alter_table :comments do
			add_index :intelligence_id
			add_index :cdk_layer
			add_index :cdk_id
		end
	end

	down do
		alter_table :comments do
			drop_index :intelligence_id
			drop_index :cdk_layer
			drop_index :cdk_id
		end

		drop_table(:comments)
	end
end

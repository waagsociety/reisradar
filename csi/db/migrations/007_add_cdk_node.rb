#add cdk_node column
Sequel.migration do
	up do
		alter_table :intelligence do
			add_column :cdk_id, String
			add_index :cdk_id
		end
	end

	down do
		alter_table :intelligence do
			drop_column :cdk_id
			drop_index :cdk_id
		end
	end
end

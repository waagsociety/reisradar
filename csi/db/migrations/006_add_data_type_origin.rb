Sequel.migration do
	up do
		add_column :intelligence, :source_name, String
		add_column :intelligence, :source_type, String
	end

	down do
		remove_column :intelligence, :source_name
		remove_column :intelligence, :source_type
	end
end

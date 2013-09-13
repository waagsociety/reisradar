Sequel.migration do
	up do
		add_column :comments, :source_name, String
	end

	down do
		remove_column :comments, :source_name
	end
end

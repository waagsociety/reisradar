Sequel.migration do
	up do
		add_column :intelligence, :emotion, Integer
	end

	down do
		remove_column :intelligence, :emotion
	end
end

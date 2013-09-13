Sequel.migration do
	up do
		alter_table :intelligence do
			add_column :latitude, "double precision"
			add_column :longitude, "double precision"
			set_column_not_null(:latitude)
			set_column_not_null(:longitude)
		end
	end

	down do
		alter_table :intelligence do
			drop_column :longitude
			drop_column :latitude
		end
	end
end

Sequel.migration do
	up do
		#CREATE DATABASE csi with template=postgistemplate owner=traveler;
		#create intelligence table	
		create_table :intelligence do
			primary_key :id
			String :body, :null => false
			column :location, 'geometry'
			timestamp :created_at, :null => false, :default => :now.sql_function
		end

		#create spatial index
		run "CREATE INDEX intelligence_location_index ON intelligence USING gist (location);"

	end
	down do
		drop_table(:intelligence)
	end
end

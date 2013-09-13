#drop lat / long columns
#rename location to geo_relevance
#drop trigger, backend will provide hex location data
Sequel.migration do
	change do
		run "DROP TRIGGER intelligence_ins ON intelligence"
		run "DROP FUNCTION IF EXISTS int_geom()"
		drop_column :intelligence, :latitude
	        drop_column :intelligence, :longitude
		rename_column :intelligence, :location, :geo_relevance
	end
end

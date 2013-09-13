#add a migration that adds a trigger and a function, 
#for creating a geometry from the lat and long that was inserted
Sequel.migration do

	up do
		sql_func = <<SQL_FUNC
		CREATE OR REPLACE FUNCTION filter_intelligence(track_kml text, distance double precision)
		RETURNS TABLE(r_id integer, r_body text, r_latitude double precision, r_longitude double precision)
		AS $$
		DECLARE g geometry;
		BEGIN
			SELECT ST_GeomFromKML(track_kml) INTO g;
				RETURN QUERY SELECT id, body, latitude, longitude FROM intelligence where ST_DWithin(location, g, distance) ORDER BY intelligence.location <-> g;
				END $$ LANGUAGE plpgsql;
SQL_FUNC
		run sql_func
	end

	down do
		run "DROP FUNCTION filter_intelligence(text,double precision)"
	end
end

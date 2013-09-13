#add a migration that adds a trigger and a function, 
#for creating a geometry from the lat and long that was inserted
Sequel.migration do
	
	up do
		sql_func = <<SQL_FUNC
		CREATE FUNCTION int_geom() RETURNS trigger AS '
		BEGIN
			UPDATE intelligence SET location = ST_SetSRID(ST_MakePoint(NEW.latitude,NEW.longitude),4326) where id = NEW.id;
		RETURN NEW;
		END;
		' Language plpgsql;
SQL_FUNC
		run sql_func

		sql_trig = <<SQL_TRIG
		CREATE TRIGGER intelligence_ins AFTER INSERT ON intelligence
			FOR EACH ROW EXECUTE PROCEDURE int_geom();
SQL_TRIG
		run sql_trig
	end

	down do
		run "DROP TRIGGER intelligence_ins ON intelligence"
		run "DROP FUNCTION IF EXISTS int_geom()"
	end
end

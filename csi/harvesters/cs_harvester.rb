#responsible for creating intelligence from crowd-sourced messages (anchored to routes in city sdk)
class CSHarvester
	
	@@source_type = "rr"
	@@source_name = "Reisradar"

	def self.source_type
		@@source_type
	end

	def self.source_name
		@@source_name
	end
	
	def self.harvest cdk_node, geom, radius, interval, tmode

		intelligence = Array.new 

		#zoeken op plek
		if(cdk_node == nil && geom != nil)
			geom_hex = geom.as_hex_ewkb
			precision = 0.00150 #decimal degrees, comes down to 55.5 meters
			precision = radius / 100000.0 #decimal degrees, comes down to 55.5 meters

			intelligence = Intelligence.select(
				:id,:geo_relevance,:body, :created_at, :source_name, :source_type, :emotion
			).where(
				"ST_DWithin(geo_relevance, '#{geom_hex}', #{precision}) AND created_at > now() - interval '#{interval} day'"
			).order(:geo_relevance)

		#zoeken op route
		elsif(cdk_node != nil)
			intelligence = Intelligence.select(
				:id,:geo_relevance,:body, :created_at, :source_name, :source_type, :cdk_id, :emotion
			).where("cdk_id = '#{cdk_node}' AND created_at > now() - interval '#{interval} day'"
			       ).order(:geo_relevance)
		end

		#verwerken resultaten
		result = Array.new
		intelligence.each do | item |
			
			geom_item = GeoRuby::SimpleFeatures::Geometry.from_hex_ewkb(item.geo_relevance)
			#replace geom hex with geo_json representation
			geo_obj = JSON.load geom_item.as_geojson
			item.geo_relevance = geo_obj
			
			if(item.source_name == nil)
				item.source_name = @@source_name 
				item.source_type = @@source_type #als in reisradar
			end

			#TODO: first make it work optimize later
			hash = item.values #trick to change model item to a hash of its values
			comments = Comment.select(:id, :body, :source_name, :created_at).where("intelligence_id = '#{item.id}'").order(:created_at).reverse
			hash["comments"] = comments

			result << hash
		end
		return result
	end
end

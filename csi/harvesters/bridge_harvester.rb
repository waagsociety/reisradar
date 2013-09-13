#responsible for adding intelligence from the bridge layer in City SDK
class BridgeHarvester
	
	@@source_type = "brug"
	@@source_name = "Gemeente Rotterdam Bruggen"

	def self.source_type
		@@source_type
	end

	def self.source_name
		@@source_name
	end

	def self.harvest geom
		if(geom.class == GeoRuby::SimpleFeatures::Point)
			latitude = geom.y
			longitude = geom.x
			return BridgeHarvester::add_bridge(latitude,longitude)
		end

		#TODO: make route relevant	
		if(geom.class == GeoRuby::SimpleFeatures::LineString)

			latitude = geom.first.y
			longitude = geom.first.x

			return BridgeHarvester::add_bridge(latitude,longitude)
		end
	end

	def self.add_bridge(latitude, longitude)
		result = Array.new
		query = "http://test-api.citysdk.waag.org/nodes?layer=rotterdam.bridge_state&lat=#{latitude}&lon=#{longitude}&per_page=5&geom"

		response = RestClient.get query
		bridge_data = JSON.parse(response)
		if(bridge_data && bridge_data["results"] && bridge_data["results"].count > 0)
			bridge_data["results"].each do | bridge |

				#
				#set centroid as location of the intelligence
				centroid = bridge["geom"]["coordinates"][0]
			bridge_name = bridge["name"]
			bridge_status = bridge["layers"]["rotterdam.bridge_state"]["data"]["state"]
			puts "found a bridge: #{bridge_name} #{bridge_status}"	

			#only add bridges that are open
			if(bridge_status != "closed" && bridge_status != "unknown")

				#create new intelligence and inject
				intelligence = Intelligence.new
				puts centroid.inspect
				geom = GeoRuby::SimpleFeatures::Point.from_x_y(centroid[0],centroid[1])
				geo_obj = JSON.load geom.as_geojson

				intelligence.geo_relevance = geo_obj 
				intelligence.body = "De #{bridge_name} is open!"
				intelligence.created_at = Time.now
				intelligence.source_name = @@source_name 
				intelligence.source_type = @@source_type 

				result << intelligence
			end

			end
		end
		return result
	end
end

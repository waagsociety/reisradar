#responsible for getting weather information from the citysdk rain layer
class RainHarvester
	
	@@source_type = "buienradar"
	@@source_name = "Buienradar.nl"

	def self.source_type
		@@source_type
	end

	def self.source_name
		@@source_name
	end

	def self.harvest geom, radius, interval, tmode, addr_start, addr_end
		if(geom.class == GeoRuby::SimpleFeatures::Point)
			latitude = geom.y
			longitude = geom.x
			return RainHarvester::add_rain(latitude,longitude)
		end
	
		if(geom.class == GeoRuby::SimpleFeatures::LineString || geom.class == GeoRuby::SimpleFeatures::MultiPoint)
			
			latitude = geom.last.y
			longitude = geom.last.x

			return RainHarvester::add_rain(latitude,longitude)
		end
	end
	
	def self.description_for_prediction(prediction)
		
		mm = 10**((prediction - 109)/32)
		rain_description = "Droog"
		if(prediction > 0 && mm > 0)
			rain_description = "Lichte neerslag"
			if(mm > 2)
				rain_description = "Neerslag"

				if(mm > 10)
					rain_description = "Zware neerslag"
				end
			end
		end
		return rain_description
	end

	def self.add_rain(latitude, longitude)
		result = Array.new
		
		query = "/regions?lat=#{latitude}&lon=#{longitude}&radius=20&layer=rain"
		rain_data = CitySDKClient.get query

		if(rain_data && rain_data.count > 0)
			cdk_node = rain_data[0]["cdk_id"]	
			
			#set centroid as location of the intelligence
			centroid = rain_data[0]["layers"]["rain"]["data"]["centroid"]

			#calculate average rain in the coming period
			predictions = rain_data[0]["layers"]["rain"]["data"]["rain"]
			
			if predictions.empty?
				puts "NO RAIN PREDICTIONS FOUND"
				return result
			end	
			
			first_description = RainHarvester::description_for_prediction predictions.values.first
			change = nil
			change_description = nil
			last = predictions.keys.last 
			
			predictions.each do | key, prediction |
				description = RainHarvester::description_for_prediction prediction
				if(description != first_description)
					change = key
					change_description = description
					break
				end
			end
			
			forecast = nil

			if(change)
				forecast = "#{first_description} tot #{change}, daarna #{change_description}"
			else
				forecast = "#{first_description} tot #{last}"
			end

			#create new intelligence and inject
			intelligence = Intelligence.new
			geom = GeoRuby::SimpleFeatures::Point.from_x_y(centroid["lon"],centroid["lat"])
			geo_obj = JSON.load geom.as_geojson

			intelligence.geo_relevance = geo_obj 
			intelligence.body = "Verwachting: #{forecast}"
			
			intelligence.created_at = Time.now
			intelligence.source_name = @@source_name 
			intelligence.source_type = @@source_type 

			hash = intelligence.values
			hash["id"] = cdk_node

			comments = Comment.select(:id, :body, :source_name, :created_at).where("cdk_id = '#{cdk_node}' AND cdk_layer = 'buienradar'").order(:created_at).reverse
			hash["comments"] = comments

			result << hash 
		end
		return result

	end
end

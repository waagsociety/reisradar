#Responsible for creating location or route relevant intelligence from City SDK NS layer
class NSHarvester
	
	@@source_type = "ns"
	@@source_name = "NS"

	def self.source_type
		@@source_type
	end

	def self.source_name
		@@source_name
	end

	def self.harvest geom, radius, interval, tmode, addr_start, addr_end
		
		#only relevant for OV modality 
		if(tmode != 'Trein') 
			return Array.new
		end

		if(geom.class == GeoRuby::SimpleFeatures::Point)
			latitude = geom.y
			longitude = geom.x
			return NSHarvester::add_ns latitude, longitude, radius

		elsif (geom.class == GeoRuby::SimpleFeatures::LineString || geom.class == GeoRuby::SimpleFeatures::MultiPoint)
			latitude = geom.first.y
			longitude = geom.first.x
			end_latitude = geom.last.y
			end_longitude = geom.last.x 
			return NSHarvester::add_ns_route latitude, longitude, end_latitude, end_longitude, radius
		end
	end

	#find ns lines for a given geometry and radius
	def self.lines(geom, radius, address_start, address_end)
		
		if (geom.class == GeoRuby::SimpleFeatures::LineString || geom.class == GeoRuby::SimpleFeatures::MultiPoint)
			latitude = geom.first.y
			longitude = geom.first.x
			end_latitude = geom.last.y
			end_longitude = geom.last.x
			
			return NSHarvester::lines_for_points latitude, longitude, end_latitude, end_longitude, radius
		end
	end

	#find ns lines for a given start end end point
	def self.lines_for_points(slat, slon, elat, elon, radius)
		
		start_stops_data = NSHarvester::stops_for_point slat, slon
		end_stops_data = NSHarvester::stops_for_point elat, elon	
		
		return NSHarvester::lines_for_nodes(start_stops_data,end_stops_data)
	  
	end

	#find ns lines for given start and end nodes
	def self.lines_for_nodes(start_stops_data, end_stops_data)
		#3. get the ptlines through start stops
		result = Array.new
		start_stops_data.each do | from |
			end_stops_data.each do |to|
				query = "/routes/?contains=#{from["cdk_id"]},#{to["cdk_id"]}"
				lines = CitySDKClient.get query
				if (!lines.empty?)
					lines.each do |line|
						result << line["cdk_id"]
					end
				end
			end
			
		end
		return result	
	end

	def self.stops_for_point(lat, long)
		point = GeoRuby::SimpleFeatures::Point.from_lon_lat(long,lat)

		#1. get region for start
		query = "/regions?lat=#{lat}&lon=#{long}&radius=1&admr::admn_level=3&per_page=1"
		region = CitySDKClient.get query
		
		#2. get stops for region
		query = "/#{region[0]["cdk_id"]}/ptstops?layer=ns&geom"
		stops = CitySDKClient.get query
		
		#3. sort stops by distance to point, so stops closer to original point get handled first
		sorted = stops.sort_by do | stop |
			geostring = stop["geom"]
			geom = GeoRuby::SimpleFeatures::Geometry.from_geojson(geostring.to_json)
			if(geom.class == GeoRuby::SimpleFeatures::Polygon)	
				geom = geom.rings.first.points.first 
			end
			distance = point.euclidian_distance geom	
		end

		#sorted.each do |stop|
		#	puts "#{stop["name"]}"
		#end

		return sorted
	end

	def self.add_ns_route(slat, slong, elat, elong, radius)

		#1. get the ns stations in start region 
		stops_data_start = NSHarvester::stops_for_point slat, slong
	       	stops_data_end = NSHarvester::stops_for_point elat, elong	
		
		#we need stops at both ends to continue
		if(stops_data_end.empty? || stops_data_start.empty?)
			return Array.new 
		end
		
		#3. get the now for each start station
		match_info = Array.new
	
		#intelligence by key	
		hresult = Hash.new
		
		#start stops by key, used to check if the line starts from the same stop
		start_stops = Hash.new

		#end stops by key, used to check if the line ends in the same stop
		end_stops = Hash.new
		
		stops_data_start.each do |stops_result|

			start_id = stops_result["cdk_id"]

			time_info = CitySDKClient.select_time_for_stop stops_result["cdk_id"]
			
			if(time_info == nil)
				next	
			end

			time_info.each do |itinerary|
				stations = itinerary["route"]["stations"]

				if(stations != nil)	
					stops_data_end.each do |end_stop_data|
						match_id = end_stop_data["cdk_id"]
						if (stations.include? match_id)
							hash = Hash[stations.map.with_index.to_a]
							if(hash[start_id] < hash[match_id])

								#stap 1. preventief ontdubbel (alleen toevoegen als hij er nog niet inzit
								composite_key ="#{itinerary["route"]["cdk_id"]}.#{itinerary["eindbestemming"]["code"]}"

								if (hresult.has_key? composite_key) #append time
									
									intelligence = hresult[composite_key]
									start_stop_name = start_stops[composite_key]
									end_stop_name = end_stops[composite_key]

									if(start_stop_name == stops_result["name"] && end_stop_name == end_stop_data["name"] )
										vt = Time.parse(itinerary['vertrektijd'])
										time = "#{vt.strftime('%H:%M')}"
										
										intelligence[:body] +=  " #{time}" 
										if(itinerary['vertraging'])
											intelligence[:body] += " (#{itinerary['vertraging']['tekst']})"
										end
									end
								else
									intelligence = NSHarvester::create_intelligence itinerary, stops_result
									hresult[composite_key] = intelligence
									start_stops[composite_key] = stops_result["name"]
									end_stops[composite_key] = end_stop_data["name"]
								end
							end
						end
					end
				end
			end
		end

		return hresult.values
	end
	
	def self.create_intelligence itinerary, stop
		cdk_id = stop["cdk_id"]
		name = stop["name"]
		geom = stop["geom"] #if point do nothing, if polygon, get centerpoint

		if(geom["type"] == "Polygon")
			polygon = GeoRuby::SimpleFeatures::Geometry.from_geojson(geom.to_json)
			centroid = polygon.rings.first.points.first 
			geom = JSON.load centroid.as_geojson
		end

		vt = Time.parse(itinerary['vertrektijd']) 
		message = "De #{itinerary['type']} van #{name} naar #{itinerary['eindbestemming']['naam']} vertrekt van spoor #{itinerary['spoor']} om #{vt.strftime('%H:%M')}"
		
		if(itinerary['vertraging'])
			message += " (#{itinerary['vertraging']['tekst']})"
		end
		
		intelligence = Intelligence.new
		intelligence.geo_relevance = geom 
		intelligence.source_name = @@source_name 
		intelligence.source_type = @@source_type 

		intelligence.body = message 
		intelligence.created_at = Time.now

		hash = intelligence.values
		ns_id = itinerary["route"]["cdk_id"] #this is what we use as an id
		hash["id"] = ns_id 	

		comments = Comment.select(:id, :body, :source_name, :created_at).where("cdk_id = '#{ns_id}' AND cdk_layer = 'ns'").order(:created_at).reverse
		hash["comments"] = comments
		
		return hash 
	end
	
	#location based
	def self.add_ns(latitude, longitude, radius)
		result = Array.new
		
		query = "/ptstops?layer=ns&lat=#{latitude}&lon=#{longitude}&per_page=1&geom&radius=#{radius}"
		stops_data = CitySDKClient.get query
		
		stops_data.each do | stop |
			cdk_id = stop["cdk_id"]
			name = stop["name"]
			geom = stop["geom"] #if point do nothing, if polygon, get centerpoint

			if(geom["type"] == "Polygon")
				polygon = GeoRuby::SimpleFeatures::Geometry.from_geojson(geom.to_json)
				centroid = polygon.rings.first.points.first #TODO: real centroid
				geom = JSON.load centroid.as_geojson
			end

			time_data = CitySDKClient.select_time_for_stop cdk_id

			if(time_data && time_data.count > 0)

				time_data.each do |itinerary|
					intelligence = NSHarvester::create_intelligence itinerary, stop
					result << intelligence
				end
			end
		end

		return result
	end
end

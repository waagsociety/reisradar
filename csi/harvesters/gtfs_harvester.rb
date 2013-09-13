#responsible for creating location or route relevant intelligence from the citysdk gtfs layer
class GTFSHarvester
	
	@@source_type = "openov"
	@@source_name = "OV"

	def self.source_type
		@@source_type
	end

	def self.source_name
		@@source_name
	end

	def self.harvest geom, radius, interval, tmode, addr_start, addr_end
		#only relevant for OV modality 
		if(tmode != 'OV') 
			return Array.new
		end

		if(geom.class == GeoRuby::SimpleFeatures::Point)
			latitude = geom.y
			longitude = geom.x
			return GTFSHarvester::add_gtfs latitude, longitude, radius

		elsif (geom.class == GeoRuby::SimpleFeatures::LineString || geom.class == GeoRuby::SimpleFeatures::MultiPoint)
			latitude = geom.first.y
			longitude = geom.first.x
			end_latitude = geom.last.y
			end_longitude = geom.last.x 
			return GTFSHarvester::add_gtfs_route latitude, longitude, end_latitude, end_longitude, radius, addr_start, addr_end
		end
	end
	
	#find gtfs lines for a given geometry and radius
	def self.lines(geom, radius, addr_start, addr_end)
		if (geom.class == GeoRuby::SimpleFeatures::LineString || geom.class == GeoRuby::SimpleFeatures::MultiPoint)
			latitude = geom.first.y
			longitude = geom.first.x
			end_latitude = geom.last.y
			end_longitude = geom.last.x 
			return GTFSHarvester::lines_for_points latitude, longitude, end_latitude, end_longitude, radius, addr_start, addr_end
		end
	end

	#find ns lines for a given start end end point
	def self.lines_for_points(slat, slon, elat, elon, radius, addr_start, addr_end)
	
		#for sanity calculate the distance between start and end
		#point1 = GeoRuby::SimpleFeatures::Point.from_lon_lat(slon,slat)
		#point2 = GeoRuby::SimpleFeatures::Point.from_lon_lat(elon,elat)
		#distance = point1.euclidian_distance point2
		#puts "distance: #{distance}"
			
		stops_start = GTFSHarvester::stops_for_point slat, slon, radius, addr_start
		stops_end = GTFSHarvester::stops_for_point elat, elon, radius, addr_end	

		return GTFSHarvester::lines_for_now(stops_start, stops_end)
	  
	end

	#return the stops for a given point and address combination
	def self.stops_for_point lat, lon, radius, addr
		
		#1. get region
		query = "/regions?lat=#{lat}&lon=#{lon}&radius=1&admr::admn_level=3&per_page=1"
		region = CitySDKClient.get query
		
		#2. get named stops in region, for provided address
		query = "/#{region[0]["cdk_id"]}/ptstops?layer=gtfs&name=#{CGI.escape(addr.split(',')[0])}&geom&per_page=100"
		named_stops = CitySDKClient.get query
		
		#3. get stops within radius
		query = "/ptstops?layer=gtfs&lat=#{lat}&lon=#{lon}&per_page=100&radius=300&geom"
		stops = CitySDKClient.get query
		
		#4. merge
		stops.concat named_stops
	
		#5. if we have none, add the closest stop	
		if(stops.empty?)
			query = "/ptstops?layer=gtfs&lat=#{lat}&lon=#{lon}&per_page=1&geom"
			stops = CitySDKClient.get query
		end

		return stops.uniq
	end

	#find ns lines for given start and end nodes
	def self.lines_for_nodes(start_stops_data, end_stops_data)
		
		#3. get the ptlines through start stops
		result = Array.new
		start_stops_data.each do | from |
			end_stops_data.each do |to|
				query = "/ptlines/?contains=#{from["cdk_id"]},#{to["cdk_id"]}"
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

	#less calls to citysdk
	def self.lines_for_now(start_stops_data, end_stops_data)
		
		result = Array.new
		start_stops_data.each do | stops_result |
			start_id = stops_result["cdk_id"]
			time_info = CitySDKClient.select_time_for_stop start_id 
			
			time_info.each do |itinerary|
				stations = itinerary["stops"]
				if(stations != nil)
					#should include the end stop, but not the start stop!	
					end_stops_data.each do |end_stop_data|
						match_id = end_stop_data["cdk_id"]
							
						if (stations.include? match_id)
							result << itinerary["cdk_id"] 
						end
					end
				end
			end
		end
		return result.uniq
	end

	#get gtfs data from citysdk, relevant for a route
	def self.add_gtfs_route(slat, slong, elat, elong, radius, start_address, end_address)
		result = Array.new
	
		start_stops_data = GTFSHarvester::stops_for_point slat, slong, radius, start_address
		end_stops_data = GTFSHarvester::stops_for_point elat, elong, radius, end_address

		#puts "start stops"	
		#start_stops_data.each do | stop |
		#	puts "#{stop["cdk_id"]}: #{stop["name"]}"
		#end

		#puts "end stops"
		#end_stops_data.each do | stop |
		#	puts "#{stop["cdk_id"]}: #{stop["name"]}"
		#end
		
		match_info = Array.new
	
		#3. get the now for each start station
		start_stops_data.each do |stops_result|
		
			start_id = stops_result["cdk_id"]
			time_info = CitySDKClient.select_time_for_stop start_id 

			time_info.each do |itinerary|
				stations = itinerary["stops"]
				if(stations != nil)
					#should include the end stop, but not the start stop!	
					end_stops_data.each do |end_stop_data|
						match_id = end_stop_data["cdk_id"]
						
						if (stations.include? match_id)
							stop_name = stops_result["name"]
							geo_relevance = stops_result["geom"]
							
							intelligence = GTFSHarvester::create_gtfs_intelligence(
								stop_name, 
								itinerary, 
								geo_relevance
							)
							result << intelligence
							break #we only need one of the end stops to match 
						end
					end
				end
			end
		end

		return result
	end

	#get gtfs data from city sdk
	def self.add_gtfs(latitude,longitude,radius)
		result = Array.new
		
		stops = CitySDKClient.find_ptstops latitude, longitude, radius
		stops.each do | stops_result |
			stop_name = stops_result["name"]
			geo_relevance = stops_result["geom"]
			time_info = CitySDKClient.select_time_for_stop stops_result["cdk_id"]
			if (time_info && time_info.count > 0)
				time_info.each do | stopinfo |
					intelligence = GTFSHarvester::create_gtfs_intelligence(stop_name, stopinfo, geo_relevance)		
					result << intelligence if intelligence != nil  
				end
			end
		end
		return result
	end

	#create intelligence from stop info
	def self.create_gtfs_intelligence(stop_name, stopinfo, geo_relevance)

		#sanitycheck
		if(stopinfo["times"] == nil) 
			return nil
		end
		timeinfo = GTFSHarvester::validTimes(stopinfo["times"])

		body = "#{stopinfo["route_type"]} #{stopinfo["route_name"]} halte #{stop_name} richting #{stopinfo["headsign"]} vertrekt om #{timeinfo}"

		match = /(?<actual>\d\d:\d\d:\d\d)\s\((?<planned>\d\d:\d\d:\d\d)\)/.match(timeinfo)
		#match = /(?<actual>\d\d:\d\d:\d\d)\s\((?<planned>\d\d:\d\d:\d\d)\)/.match('14:00:06 (14:00:24)')
		if(match && match[:planned] != nil && match[:actual] != nil)
			duration = (Time.parse(match[:actual]) - Time.parse(match[:planned])) / 60
			if(duration > 0)
				delay = duration.ceil
				body = "#{stopinfo["route_type"]} #{stopinfo["route_name"]} halte #{stop_name} richting #{stopinfo["headsign"]} heeft tot #{delay} min. #vertraging en vertrekt om #{match[:actual]}"
			else
				delay = (duration.floor).abs
				body = "#{stopinfo["route_type"]} #{stopinfo["route_name"]} halte #{stop_name} richting #{stopinfo["headsign"]} is tot #{delay} min. te #vroeg en vertrekt om #{match[:actual]}"
			end
		end	

		intelligence = Intelligence.new
		intelligence.geo_relevance = geo_relevance  

		intelligence.source_name = @@source_name 
		intelligence.source_type = @@source_type 
		intelligence.body = body
		intelligence.created_at = Time.now
		
		hash = intelligence.values
		hash["id"] = stopinfo["cdk_id"] #ptline id, this will be used to associate comments

		#inject existing comments
		comments = Comment.select(:id, :body, :source_name, :created_at).where("cdk_id = '#{stopinfo["cdk_id"]}' AND cdk_layer = 'openov'").order(:created_at).reverse
		hash["comments"] = comments
		return hash
	end

	#return only valid times from times available
	def self.validTimes(times)

		validTime = "<br>"	
		times.each do | time |
			match = /(?<actual>\d\d:\d\d:\d\d)/.match(time)
		if(match && match[:actual])
			duration = (Time.parse(match[:actual]) - Time.now) / 60
			if(duration >= 1)
				validTime = "#{validTime} #{time}"
			end
		end
		end
		return validTime
	end
end

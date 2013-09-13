#responsible for communication with citysdk, especially the write API
require 'redis'
require 'redis-lock'

class CitySDKClient

	#TODO: refactor out email & password, to external settings file
	@@email = 'username'
	@@password = 'password' #api

	@@url = "https://api.citysdk.waag.org"
	@@database = nil
	@@count = nil

	@@redis = Redis.new

	def self.set_db db
		@@database = db
	end

	def self.reset_count
		@@count = 0
	end

	def self.get_count
		return @@count
	end

	#responsible for all get calls to the CitySDK API	
	def self.get url_fragment, header = nil
		@@count = @@count + 1
		query = "#{@@url}#{url_fragment}"
		results = nil
		
		begin
			if(header == nil)
				response = RestClient.get(query)
			else
				response = RestClient.get query, header
			end

			if response.code == 200
				results = JSON.parse(response)["results"]
				# puts "--------------------------"
			  	# puts query
				# puts JSON.pretty_generate results
				# puts "--------------------------"
			else
				puts "Failed CitySDK API call:#{response.code}\n#{query}"
			end
		rescue => e
			puts "CitySDK API Error:#{e}\n#{query}"
			puts e.backtrace 
		end
	
		return results 
	end

	#responsible for all put calls to the CitySDK API
	#locks access to the write API
	def self.put url_fragment, data
		result = "{false}"
		
		#locks the write API, which is necessary for security
		@@redis.lock_for_update('citysdk_write') do
			token = authenticate
			begin
				request =  "#{@@url}#{url_fragment}"
				response = RestClient.put request, data.to_json, :content_type => 'json', 'X-Auth' => token
				result = (JSON.load response)["results"]
			rescue RestClient::MethodNotAllowed => e
				puts e
			end
			release_token token
		end
		
		return result
	end
	
	#save node in the reisradar comment layer, so it can be exposed via the webservice
	def self.activate_comment node
		puts "activating node: #{node}"
		data = 
		{
			:data => 
			{
				:cdk_id => node
			} 
		}
		self.put "/#{node}/reisradar.comments", data
	end

	#create a route from the specified cdk nodes
	def self.create_route start_node, end_node, modalities
		
		code = "#{start_node["cdk_id"]}_#{end_node["cdk_id"]}"
	        display_name = "#{start_node["name"]} -> #{end_node["name"]}"
		cdk_start = start_node["cdk_id"]
		cdk_end = end_node["cdk_id"]
		
		data = 
		{
			:create =>
			{
				:params => 
				{
					:create_type => "routes"
				},

			},
			:nodes =>
			[{
				:cdk_ids => [cdk_start,cdk_end],
				:name => code,
				:modalities => modalities,
				:data => {
					:display_name => display_name
				}
			}]
		}

		result = self.put "/nodes/reisradar.routes", data
		return result

	end
	
	#get a security token 
	def self.authenticate
		query =  "/get_session?e=#{@@email}&p=#{@@password}"
		response = self.get query
		token = response[0]
		return token
	end

	#release a security token
	def self.release_token token
		request =  "/release_session"
		response = self.get request, 'X-Auth' => token
	end

	#find the ptstops within the radius of a certain point	
	def self.find_ptstops latitude, longitude, radius
		query = "/ptstops?lat=#{latitude}&lon=#{longitude}&per_page=100&radius=#{radius}&geom"
		stops = self.get query 
		return stops
	end

	#find the ptlines for a given ptstop
	def self.find_ptlines_for_stop ptstop
		query = "/#{ptstop}/select/ptlines"
		lines = self.get query
		return lines
	end

	#find the ptstops of a given ptline
	def self.find_ptstops_for_line ptline
		query = "/#{ptline}/select/ptstops"
		stops = self.get query
		return stops
	end

	#find the time info for a ptstop
	def self.select_time_for_stop ptstop
		query ="/#{ptstop}/select/now" 
		time_info = self.get query 
		return time_info
	end	

	#find the first cdk_node for a given geojson point
	def self.find_node point
		query = "/nodes?lat=#{point["coordinates"][1]}&lon=#{point["coordinates"][0]}&per_page=1"
		nodes = self.get query
		return nodes[0]
	end

	#find all routes for a specific start and end node
	def self.find_route start_node, end_node, modalities
		#TODO: change when API supports more than one modality, and doesn't break
		query = "/routes?starts_in=#{start_node["cdk_id"]}&ends_in=#{end_node["cdk_id"]}&geom&layer=reisradar.routes"
		puts query
		routes = self.get query
		puts routes
		return routes
	end

	#where am i    
	def self.get_municipality(geom,radius=1)

		#get geo related params for query string
		geoparams = self.get_url_params_from_geom_object geom, radius 

		query = "/nodes?admr::admn_level=3&per_page=1&#{geoparams}"
		response_obj = self.get(query)
		municipality = response_obj["results"].first["layers"]["admr"]["data"]["name"] rescue nil
		return municipality
	end 

	def self.scale_bounds box, scale                
		topleft = box[0]
		bottomright = box[1]
		w = (bottomright.x - topleft.x)
		h = (bottomright.y - topleft.y) 
		nw = w * scale
		nh = h * scale

		tl = GeoRuby::SimpleFeatures::Point.from_x_y(topleft.x - (nw - w) * 0.5, topleft.y - (nh - h) * 0.5 ) 
		br = GeoRuby::SimpleFeatures::Point.from_x_y(tl.x + nw, tl.y + nh) 

		return [tl,br]

	end 

	def self.get_regions(geom,radius,max) 

		#get geo related params for query string
		geoparams = self.get_url_params_from_geom_object geom, radius

		query = "/regions?#{geoparams}&layer=admr&radius=#{radius}"
		regions = self.get(query)
		
		#get only the important regions                         
		sorted_regions = regions.sort_by do |region| 
			key = region["layers"]["admr"]["data"]["admn_level"].to_i rescue -1
		end

		region_names = Array.new

		sorted_regions.reverse_each do |region|
			name = region["layers"]["admr"]["data"]["name"] rescue nil
			level = region["layers"]["admr"]["data"]["admn_level"].to_i rescue -1
			region_names.push(name) if(name != nil && level  > 3) #regions within municipality   
		end                         

		region_names = region_names.slice(0,max) if region_names.length > max 
		return region_names 

	end  

	def self.get_url_params_from_geom_object geom, radius
		geoparams = ""
		if(geom.class == GeoRuby::SimpleFeatures::Point)
			geoparams = "lat=#{geom.y}&lon=#{geom.x}&radius=#{radius}"      
		elsif(geom.class == GeoRuby::SimpleFeatures::LineString  || geom.class == GeoRuby::SimpleFeatures::MultiPoint) 
			box = geom.bounding_box()
			bigger_box = self.scale_bounds box, 1.1

			geoparams = "bbox=[#{bigger_box[0].y},#{bigger_box[0].x},#{bigger_box[1].y},#{bigger_box[1].x}]"
		end 
		return geoparams
	end

  def self.get_osm_nodes(osm_key,importance_order,geom,radius,max)

		#get geo related params for query string
		geoparams = self.get_url_params_from_geom_object geom, radius
                 
    search_geom = nil

		#get a buffer around the route for filtering a result of a bounding box query
    #buffer radius is 10 percent of total distance 
    if geom.class != GeoRuby::SimpleFeatures::Point
		  linestring = self.multipoint_to_linestring geom
		  search_geom = self.get_geometry_with_buffer linestring, (linestring.spherical_distance / 10)
    end
    
		#gather nodes stop when we have max                                        
		best_nodes = Array.new

		#individual queries for each osm feature key value in order of importance till we have enough
		#we could use the | an dataop=or functionality but then we would get to many unimportante results
		importance_order.each do |val|
			query = "/nodes?#{geoparams}&osm::#{osm_key}=#{val}&per_page=100&geom" 
			nodes = self.get(query)
			nodes.each do | osm_node |            
				key_obj = osm_node["layers"]["osm"]["data"] rescue nil
				l = importance_order.index(key_obj[osm_key])  
				key_obj["importance"] = importance_order.length #minimum importance    
				if l                            
					key_obj["importance"] = l 
				end
				
				best_nodes.push(key_obj)
				
				# filter results of bounding box with given geometry??
				if search_geom #found with box, apply further bounds 
				  g = GeoRuby::SimpleFeatures::Geometry.from_geojson(osm_node["geom"].to_json)    
          point = GeoRuby::SimpleFeatures::Point.from_x_y(g.to_coordinates.flatten[0],g.to_coordinates.flatten[1]) #first point, works on any type of geom  
          if geom_contains_point search_geom, point
            best_nodes.push(key_obj)
          end
        else #found via point with radius
          best_nodes.push(key_obj)
        end  
			
			end  
			break if best_nodes.length > max  	  
		end  


		#get names / alt names from nodes    
		sorted_best_nodes = best_nodes.sort_by{|node| node["importance"] }
		node_names = Array.new
		sorted_best_nodes.each do |node|       
			if node["ref"] 
				node_names.push(node["ref"]) if !node_names.include?(node["ref"])
			end
			if node["name"]  
				node_names.push(node["name"] ) if !node_names.include?(node["name"] )
			end
			if node["alt_name"] 
				node_names.push(node["alt_name"]) if !node_names.include?(node["alt_name"])
			end
			if node["int_ref"] 
				node_names.push(node["int_ref"]) if !node_names.include?(node["int_ref"])
			end          
		end 

		#limit amount of names in list
		node_names = node_names.slice(0,max) if node_names.length > max

		return node_names
	end 
	
	def self.multipoint_to_linestring geom
	  if not geom.is_a? GeoRuby::SimpleFeatures::MultiPoint
		  "multipoint_to_linestring expects a multi point" 
		end  
		return GeoRuby::SimpleFeatures::LineString.from_points(geom.points)
	end
	
	def self.get_geometry_with_buffer geom, meters
		
	  buffer = geom
    
    #use postgis to get a buffer area around our linestring
		#GRANT ALL ON spatial_ref_sys TO traveler
    if geom.is_a? GeoRuby::SimpleFeatures::MultiPoint
      @@database.fetch("SELECT ST_AsGeoJSON(ST_Transform(Geometry(ST_Buffer(Geography(ST_SetSRID(ST_GeomFromText('MULTIPOINT (#{geom.text_representation})'), 4326)),#{meters})),4326))")  do |row|    
  			buffer = GeoRuby::SimpleFeatures::Geometry.from_geojson(row[:st_asgeojson])
  		end
    elsif geom.is_a? GeoRuby::SimpleFeatures::LineString
      @@database.fetch("SELECT ST_AsGeoJSON(ST_Transform(Geometry(ST_Buffer(Geography(ST_SetSRID(ST_GeomFromText('LINESTRING (#{geom.text_representation})'), 4326)),#{meters})),4326))")  do |row|    
  			buffer = GeoRuby::SimpleFeatures::Geometry.from_geojson(row[:st_asgeojson])
  		end                                                 
    else
      "get_geometry_with_buffer not implemented for #{geom.class}"
    end 
		
		return buffer
	end 

	def self.get_ns_stations(geom,radius,max) 

		importance_order = ["megastation","knooppuntIntercitystation","intercitystation","knooppuntStoptreinstation","stoptreinstation"]     
		search_geom = nil

		#get a buffer around the route
		if geom.class != GeoRuby::SimpleFeatures::Point
		  linestring = self.multipoint_to_linestring geom
		  search_geom = self.get_geometry_with_buffer linestring, (linestring.spherical_distance / 10)
		end  
	                                                                                                                         
		#get geo related params for query string
		geoparams = self.get_url_params_from_geom_object geom, radius
		#get all stations in geom
		query = "/nodes?#{geoparams}&layer=ns&geom&per_page=50" 

		best_nodes = Array.new
		nodes = self.get query
		nodes.each do | node |            
			key_obj = node["layers"]["ns"]["data"]  rescue nil
			l = importance_order.index(key_obj["type"])  
			key_obj["importance"] = importance_order.length #minimum importance 
			if l                            
				key_obj["importance"] = l 
			end

			if search_geom #found with box, apply further bounds 
				g = GeoRuby::SimpleFeatures::Geometry.from_geojson(node["geom"].to_json)    
				point = GeoRuby::SimpleFeatures::Point.from_x_y(g.to_coordinates.flatten[0],g.to_coordinates.flatten[1]) #first point, works on any type of geom  

				if geom_contains_point search_geom, point
				  best_nodes.push(key_obj)
				end

			else #found via point with radius
				best_nodes.push(key_obj)
			end          
		end

		sorted_best_nodes = best_nodes.sort_by{|node| node["importance"] } 

		node_names = Array.new
		sorted_best_nodes.each do |node|       
			if node["naam_lang"] 
				node_names.push(node["naam_lang"]) if !node_names.include?(node["naam_lang"]) 
			elsif node["name"]  #suddenly our results have change and we don't get naam_lang anymore
			  node_names.push(node["name"]) if !node_names.include?(node["name"])	
			end
		end

		node_names = node_names.slice(0,max) if node_names.length > max
		return node_names

	end
	
	def self.geom_contains_point geom, point
	  if(geom.is_a? GeoRuby::SimpleFeatures::GeometryCollection  )     
			geom.geometries.each do |bound|
				if bound.contains_point?(point) 
					return true  
				end
			end
		else  
			if geom.contains_point?(point)
				return true
			end
		end            
		return false
	end
	
	#
	# filter an array of intelligence objects to object that fit within a geometry (line string or point with radius)
	#
	def self.filter_intelligence_with_geom intelligence, geom, radius = 500

		result = Array.new

		if(geom.class == GeoRuby::SimpleFeatures::Point)
			intelligence.each do |intel|
				p = GeoRuby::SimpleFeatures::Geometry.from_geojson(intel.geo_relevance.to_json)
				if geom.spherical_distance(p) < radius
					result.push intel
				end
			end
		else 
			#get a buffer around the route , buffer radius is 10 percent of total distance
			linestring = self.multipoint_to_linestring geom
			search_geom = self.get_geometry_with_buffer linestring, (linestring.spherical_distance / 10)
                                                     
			intelligence.each do |intel|
				p = GeoRuby::SimpleFeatures::Geometry.from_geojson(intel.geo_relevance.to_json)
				if geom_contains_point search_geom, p
					result.push intel
				end
			end                                    

		end    

		return result

	end
	
end

require "twitter"
require_relative "../config/settings"                                                                                                                     

#Responsible for creating location or route relevant intelligence from the twitter API
class TwitterHarvester   
	
	@@source_type = "twitter"
	@@source_name = "Twitter"

	def self.source_type
		@@source_type
	end

	def self.source_name
		@@source_name
	end
	
	@@client = nil

	def self.connect
		begin
			if @@client == nil
				@@client = Twitter::Client.new(
					:oauth_token => ACCESS_TOKEN,
					:oauth_token_secret => ACCESS_TOKEN_SECRET,
					:consumer_key => CONSUMER_KEY,
					:consumer_secret => CONSUMER_KEY_SECRET,
				)
			end
		rescue Twitter::Error => e
			puts "twitter error #{e}" 
		end 
	end

	def self.harvest geom, radius, interval, tmode, addr_start, addr_end

		max = 5 

		#put this somewhere global
		highway_importance_order_car = ["motorway","trunk","primary","secondary","tertiary","road","unclassified"]
		highway_importance_order_pedestrian = ["pedestrian","living_street","residential","track","tertiary","secondary","primary"]
		highway_importance_order_bike = ["cycleway","primary","secondary","tertiary","road","unclassified"]

		#put this somewhere global
		cycleway_importance_order = ["lane","track","opposite"]

		#put this somewhere global
		place_importance_order = ["neighbourhood","hamlet","island","suburb","farm","village","town","city"] #no village, town

		#get stuff from citysdk
		municipality = CitySDKClient::get_municipality(geom)                                                                            
		hoods = CitySDKClient::get_osm_nodes("place",place_importance_order,geom,radius,max) 
		regions = CitySDKClient::get_regions(geom,radius,3)

		#get nodes (streets,or stations) based on transport mode
		nodes = [] #/s 
		case tmode
		when "Lopend"
			nodes = CitySDKClient::get_osm_nodes("highway",highway_importance_order_pedestrian,geom,radius,max)   
		when "Fiets"
			streets_a =  CitySDKClient::get_osm_nodes("highway",highway_importance_order_bike,geom,radius,max) 
			streets_b =  CitySDKClient::get_osm_nodes("cycleway",cycleway_importance_order,geom,radius,max) if streets_a.length < max
			nodes = streets_a
			nodes.concat(streets_b) if streets_b != nil
		when "OV"
			nodes = CitySDKClient::get_ns_stations(geom,radius,max)         
		when "Auto"
			nodes = CitySDKClient::get_osm_nodes("highway",highway_importance_order_car,geom,radius,max) 
		end

		#words to use in twitter query
		search_words_any = nodes.concat(hoods).concat(regions)
		search_words_all = []

		#get a coordinate and radius for twitter geo search
		default_point = nil   
		if(geom.class == GeoRuby::SimpleFeatures::Point)
			default_point = geom     
		elsif(geom.class == GeoRuby::SimpleFeatures::LineString || geom.class == GeoRuby::SimpleFeatures::MultiPoint) 
			box = geom.bounding_box()  
			default_point = GeoRuby::SimpleFeatures::Point.from_x_y((box[0].x + box[1].x)/2 ,(box[0].y + box[1].y)/2)
			radius = box[0].spherical_distance(box[1])/2 #half of topleft to bottomright  
		end

		#modality dependend filters for twitter search query (tags and users) these should be configurable or end user defined
		users = []
		tags = []  
		case tmode
		when "Lopend" 
			user = ["112Alarm"]  
			tags = ["p2000","watiserloos"]   
		when "Fiets"
			user = ["112Alarm"]  
			tags = ["p2000","watiserloos","fiets"]
		when "OV"
			user = ["112Alarm","NS_online","ProRail","nsvertraging","trein"] 
			tags = ["ns","trein","bus","p2000","watiserloos","storing"]         
		when "Auto"
			user = ["ANWBVerkeer","112Alarm"]
			tags = ["file","p2000","watiserloos","verkeer"]      
		end

		#perform twitter search queries, when geo search and bbox use center of bbox and radius is distance to corner
		tweet_intelligence = Array.new
		tweet_intelligence.push TwitterHarvester::get_tweets default_point, search_words_all, search_words_any, [], tags if !search_words_any.empty?   #user definable? 
		tweet_intelligence.push TwitterHarvester::get_tweets default_point, search_words_all, search_words_any, users, [] if !search_words_any.empty?   #user definable?                                                   
		tweet_intelligence.push TwitterHarvester::get_tweets default_point, [], [], [], tags, radius if !search_words_any.empty?   #user definable? 

		result = Array.new

		#sort all result by creation time
		tweet_intelligence.flatten!                                 
		tweet_intelligence.sort_by{|intelligence| intelligence.created_at}.reverse_each{|intelligence| 
			result << intelligence
		} 

		#remove duplicates
		result = self.dedupe result

		#filter geo
		result = CitySDKClient::filter_intelligence_with_geom result,geom,radius   

		return result

	end 

	def self.post_tweet text,geom
		self.connect
		begin
			point = GeoRuby::SimpleFeatures::Point.from_x_y(geom.to_coordinates.flatten[0],geom.to_coordinates.flatten[1])
			options = {}         
			options[:lat] = point.y
			options[:long] = point.x
			@@client.update text, options
		rescue Twitter::Error => e
			puts "twitter error #{e}"
		end

	end



	def self.dedupe intelligence
		return intelligence.uniq
	end

	#with radius == nil no geo search will be performed         
	def self.get_tweets default_geopoint, words_all, words_any, users=[], hashtags=[], radius = nil

		self.connect

		#client.search("to:justinbieber marry me", :count => 3, :result_type => "recent").results.map do |status|

		options = {}  

		#param defaults
		options[:lang] = "nl"

		#build the query param for searching user,tags and words	  
		query_parts = Array.new
		query_parts.push words_all.map {|item| "\"#{item}\"" }.join(" ") if !words_all.empty?  
		query_parts.push words_any.map {|item| "\"#{item}\"" }.join(" OR ") if !words_any.empty?  #quote all keywords
		query_parts.push users.map {|item| "from:#{item}" }.join(" OR ") if !users.empty? 
		query_parts.push hashtags.map {|item| "##{item}" }.join(" OR ") if !hashtags.empty?
		param_q = query_parts.join(" ")

		#build the geocode param if we use it
		if radius
			options[:geocode] =  "#{default_geopoint.lat},#{default_geopoint.lon},#{radius.to_f/1000.to_f}km"      
		end    

		result = Array.new

		begin
			statuses = @@client.search(param_q, options).results.map
		rescue Twitter::Error => e
			puts "twitter error #{e}"
		else  
			statuses.each do |status|
				intelligence = Intelligence.new
				geom = JSON.load default_geopoint.as_geojson

				if status.geo
					geom = JSON.load GeoRuby::SimpleFeatures::Point.from_x_y(status.geo.coordinates[1],status.geo.coordinates[0]).as_geojson 
				end
				
				intelligence.geo_relevance = geom      
				intelligence.body = status.text  
				intelligence.created_at = status.created_at 
				intelligence.source_name = status.user.screen_name
				intelligence.source_type = @@source_type
				result.push intelligence  
			end
		end  

		return result	  
	end

end                      

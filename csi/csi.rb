#central stream of intelligence service
require 'sinatra'
require 'sinatra/sequel'
require 'json'
require 'geo_ruby'
require 'geo_ruby/geojson'
require 'rest_client'  
require 'digest/md5'

require_relative 'harvesters/twitter_harvester'
require_relative 'harvesters/ns_harvester'
require_relative 'harvesters/rain_harvester'
require_relative 'harvesters/gtfs_harvester'
require_relative 'harvesters/bridge_harvester'
require_relative 'harvesters/cs_harvester'
require_relative 'utility/citysdk_client'
require_relative 'utility/ip_util'

configure do | rr |

	#database connection
	dbconf = JSON.parse(File.read('db/database.json'))	

	conn = "postgres://#{dbconf['user']}:#{dbconf['password']}@#{dbconf['host']}/#{dbconf['database']}"
	rr.database = conn
	
	CitySDKClient::set_db database

	Dir[File.dirname(__FILE__) + '/model/*.rb'].each {|file| require file }


	#if environment is development
	if settings.development?
		set :bind, IPUtil::local_ip
	end

	#if environment is production
	if settings.production? && defined?(PhusionPassenger)
		PhusionPassenger.on_event(:starting_worker_process) do |forked|
			if forked
				database.disconnect #why?
			else
			#in spawning mode
			end
		end
	end
end


before do 
	content_type 'application/json'
	#TODO: check if necessary
	headers 'Access-Control-Allow-Origin' => '*'
	#puts JSON.pretty_generate params
	#reset citysdk stat count
	CitySDKClient::reset_count
end

after do

	if(params[:source] != nil)
		source = params[:source]
		puts "Source: #{source}, number of calls to CitySDK: #{CitySDKClient::get_count}"
	end

	if(params[:tmode] != nil)
		source = params[:tmode]
		puts "Source: #{source}, number of calls to CitySDK: #{CitySDKClient::get_count}"
	end
end

get '/' do
	"CSI"
end

#account registration
post '/member/register' do
	#1. get username & password from parameters
	username = params[:username]

	#2 get password
	password = params[:password]
	md5 = Digest::MD5.hexdigest(password)	
	
	if(username != nil && username.length > 0 && password != nil && password.length > 0)
		
		#3. check if username is taken
		existing = Account.find(:username => params[:username])
		
		if(existing)
			return "#{(existing.password == md5)}" #returns true if the provided password is the same. so re-registration on the same phone,for example after reinstall will work..
		else
			#4. if not taken, register username with password
			account = Account.create do |account|
				account.username = username
				account.password = md5 #don't save password plain text
			end
			return "#{account.valid?}"
		end
	end
	return false
end

#helper method
def isValid(username, password)
	if(username != nil && username.length > 0 && password != nil && password.length > 0)
		md5 = Digest::MD5.hexdigest(password)
		existing = Account.find(:username => username)
		if(existing)
			valid = (existing.password == md5)
			return valid
		end
	end
	return false
end

#callback for citysdk
post '/citysdk/comments' do

	#get cdk node id from citysdk	
	hash  = JSON.parse(params.keys.first)
	cdk_id = hash["cdk_id"]

	debug = "No errors"
	results = Array.new
	
	begin	
		intelligence = Intelligence.select(:body, :created_at, :emotion
			).where("cdk_id = '#{cdk_id}'")
		
		intelligence.each do | intelligence |
			hash = intelligence.to_hash
			#TODO: comments op comments indien gewenst

			results << hash
		end

		comments = Comment.select(:body, :cdk_layer, :created_at).where("cdk_id = '#{cdk_id}'")

		comments.each do | comment |
			hash = comment.to_hash
			results << hash
		end
	rescue => e
		debug = "Error: #{e}" 
	end

	data = 
	{
		:data => 
		{
			:node_id => "#{cdk_id}",
			:comments => results,
			:debug => debug
		}
	}

	return data.to_json
end

#creates or finds route
post '/route/select/?' do

	response['Access-Control-Allow-Origin'] = '*'
	
	#transform tmode to array of citysdk modalities
	modalities = tmode_to_modalities params[:tmode]

	geom = GeoRuby::SimpleFeatures::Geometry.from_geojson(params[:geo_relevance])
	legId = params[:leg_id]

	start_point =  JSON.load geom.points.first.as_geojson
	end_point = JSON.load geom.points.last.as_geojson

	#1. get cdk_nodes for these points
	start_node = CitySDKClient.find_node start_point
	end_node = CitySDKClient.find_node end_point

	#2. get routes for these nodes
	routes = CitySDKClient.find_route start_node, end_node, modalities

	if routes.empty?
		response =  CitySDKClient.create_route start_node, end_node, modalities #HACK, do it twice to get it back
		routes = CitySDKClient.find_route start_node, end_node, modalities
	else
		#TODO: select for modality
	end
	
	routes[0]["leg_id"] = legId
	return routes[0].to_json
	
end

#convert tmode
def tmode_to_modalities tmode
	
	modalities = Array.new	
	case tmode
		when 'Lopend'
			modalities = ['foot']
		when 'Fiets'
			modalities = ['bicycle','moped']
		when 'Auto'
			modalities = ['car','motorbike','truck']
		when 'OV'
			modalities = ['tram','subway','bus','ferry']
		when 'Trein'
			modalities = ['rail']
	end
	return modalities
end



#post comment
post '/comment/?' do
	response['Access-Control-Allow-Origin'] = '*'
	
	puts params.inspect

	source_name = params[:source]
	token = params[:token]
	body = params[:message]
	cdk_id = params[:cdk_node]

	#verify the username exists, and the correct token is provided
	if(!isValid(source_name, token))
		puts "token / name not valid"
		return "false".to_json
	end
		
	#comment on intelligence
	#cdk_id indicates route
	if params[:source_type] == "rr"
		int_id = params[:intelligence_id]
		comment = Comment.create do |comment|
			comment.intelligence_id = int_id
			comment.cdk_id = cdk_id
			comment.body = body
			comment.source_name = source_name
		end
		return "#{comment.valid?}".to_json
	#comment on open data
	#cdk_id indicates something else, region or ptline for example
	else
		cdk_id = params[:cdk_node]
		cdk_layer = params[:source_type]

		comment = Comment.create do |comment|
			comment.cdk_id = cdk_id
			comment.cdk_layer = cdk_layer
			comment.body = body
			comment.source_name = source_name
		end

		#save comment in citysdk
		begin
       			response = CitySDKClient::activate_comment cdk_id
			puts response
		rescue => e
			puts "Error activating comment: #{e}"
		end

		return "#{comment.valid?}".to_json
	end

	return "false".to_json
	
end

#post intelligence
post '/intelligence/?' do

	response['Access-Control-Allow-Origin'] = '*'
	
	source_name = params[:source]
	token = params[:token]

	#verify the username exists, and the correct token is provided
	if(!isValid(source_name, token))
		return "false".to_json
	end

	if not params[:cdk_node].to_s.empty?
		cdk_node = params[:cdk_node]
	end
	
	emo_index = params[:emotion]

	geom = GeoRuby::SimpleFeatures::Geometry.from_geojson(params[:geo_relevance])
	hex = geom.as_hex_ewkb

	#create database object by simple insert        
	int = Intelligence.create do | it |
		it.body = params[:message]
		it.source_name = params[:source]
		it.source_type = 'rr'
		it.geo_relevance = hex
		it.cdk_id = cdk_node
		it.emotion = emo_index
	end
	
	#post to twitter
  	# puts "twitter post"
  	# TwitterHarvester::post_tweet params[:message], geom
        
	#save intelligence as comment on a route in citysdk
	begin
		puts "activating comment: #{cdk_node}"
		response = CitySDKClient::activate_comment cdk_node
		puts response
	rescue => e
		puts "Error activating intelligigence comment: #{e}"
	end
	
	#object has been saved, return if this is a valid object to indicate succes
	"#{int.valid?}".to_json
end

#validate that there exist valid ptlines on a given route
post '/route/validate/?' do

	response['Access-Control-Allow-Origin'] = '*'
	radius = 150
	
	if params[:radius] != nil 
		radius = params[:radius].to_f
	end
	
	tmode = "Trein"
	if not params[:tmode].to_s.empty?
		tmode = params[:tmode] 
	end

	if(params[:geo_relevance] != nil)
		geom = GeoRuby::SimpleFeatures::Geometry.from_geojson(params[:geo_relevance])
	end

	if(params[:address_start] != nil)
		address_start = params[:address_start]
	end

	if(params[:address_destination] != nil)
		address_end = params[:address_destination]
	end

	result = Array.new

	#provide the original user input for determining names of stations or stops	
	if(tmode == "Trein")
		result = NSHarvester::lines(geom, radius, address_start, address_end)
	end

	if(tmode == "OV")
		result = GTFSHarvester::lines(geom, radius, address_start, address_end)
	end

	return result.to_json

end

#get intelligence
post '/intelligence/filter/?' do

	response['Access-Control-Allow-Origin'] = '*'
	
	radius = 150
	if params[:radius] != nil 
		radius = params[:radius].to_f
	end

	interval = 3
	if params[:interval] != nil
		interval = params[:interval].to_i
	end 

	tmode = "Auto"
	if not params[:tmode].to_s.empty?
		tmode = params[:tmode] 
	end

	cdk_node = nil	
	if not params[:cdk_node].to_s.empty?
		cdk_node = params[:cdk_node]
	end

	if(params[:geo_relevance] != nil)
		geom = GeoRuby::SimpleFeatures::Geometry.from_geojson(params[:geo_relevance])
	end
	
	source_type = nil
	if(params[:source] != nil)
		source_type = params[:source]
	end

	if(params[:address_start] != nil)
		address_start = params[:address_start]
	end

	if(params[:address_destination] != nil)
		address_end = params[:address_destination]
	end

	result = Array.new

	harvesters = [NSHarvester, GTFSHarvester, TwitterHarvester,RainHarvester]
	harvesters.each do | harvester |
		begin
			 if(source_type == nil || harvester::source_type == source_type)
			 	messages = harvester::harvest geom, radius, interval, tmode, address_start, address_end
			 	source = Hash.new
			 	source[:name] = harvester::source_type
			 	source[:title] = harvester::source_name
			 	source[:messages] = messages
			 	source[:count] = messages.count
			 	result << source
			 end
		rescue => e
			puts "Error harvesting: #{harvester} => #{e}"
			puts e.backtrace 
		end
	end
	
	if(source_type == nil || CSHarvester::source_type == source_type)
		messages = CSHarvester::harvest cdk_node, geom, radius, interval, tmode
		
		source = Hash.new
		source[:name] = CSHarvester::source_type
		source[:title] = CSHarvester::source_name
		source[:messages] = messages
		source[:count] = messages.count
        	result << source
	end


	return result.to_json
end

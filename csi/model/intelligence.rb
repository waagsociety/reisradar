require 'sequel/model'

class Intelligence < Sequel::Model(:intelligence)
	plugin :validation_helpers
	plugin :json_serializer
	
	def validate
		super
		validates_presence [:body, :geo_relevance]
	end
end

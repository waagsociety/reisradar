require 'sequel/model'

class Comment < Sequel::Model(:comments)
	plugin :validation_helpers
	plugin :json_serializer

	def validate
		super
		validates_presence [:body, :source_name]
	end
end

require 'sequel/model'

class Account < Sequel::Model(:account)
	plugin :validation_helpers
	plugin :json_serializer

	def validate
		super
		validates_presence [:username, :password]
	end
end

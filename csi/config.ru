require 'rubygems'
require 'bundler'
Bundler.require

require './csi.rb'

set :environment, :production
run Sinatra::Application

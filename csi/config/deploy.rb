# require "bundler/capistrano"


set :application, "reisradar"
# 
# set :scm, :git

set :repository,  "."
set :scm, :none


set :branch, "master"

set :deploy_to, "/var/www/reisradar"
# set :deploy_via, :remote_cache
set :copy_exclude, ['db/database.json','tmp']
set :copy_exclude, ['db/database.json','tmp']

set :deploy_via, :copy


set :use_sudo, false
set :user, "your_user_name"

default_run_options[:shell] = '/bin/bash'

# role :web, "test-api.citysdk.waag.org"                          # Your HTTP server, Apache/etc
# role :app, "test-api.citysdk.waag.org"                          # This may be the same as your `Web` server
# role :db,  "test-api.citysdk.waag.org", :primary => true       # This is where Rails migrations will run
# 
role :web, "server_name"                          # Your HTTP server, Apache/etc
role :app, "server_name"                          # This may be the same as your `Web` server
role :db,  "server_name", :primary => true       # This is where Rails migrations will run

namespace :deploy do
  task :start do ; end
  task :stop do ; end
  
  # Assumes you are using Passenger
  task :restart, :roles => :app, :except => { :no_release => true } do
    run "touch #{File.join(current_path,'tmp','restart.txt')}"
  end
 
  task :finalize_update, :except => { :no_release => true } do

    run <<-CMD
      rm -rf #{latest_release}/log &&
      mkdir -p #{latest_release}/public &&
      mkdir -p #{latest_release}/tmp &&
      ln -s #{shared_path}/log #{latest_release}/log
    CMD

    run "ln -s #{shared_path}/config/database.json #{release_path}/db/"
 
  end
end  



//Responsible for geolocation, including handling Android quirks
Ext.define('ReisRadar.util.Locator', {
	singleton: true,
	requires: 'Ext.device.Geolocation',
	
	constructor: function(config) 
	{
		this.initConfig(config);
		
		//default location, pakhuis de zwijger
		var position = 
		{
			coords : 
			{
				latitude: 52.37648246529953,
				longitude: 4.921724796295166
			}
		};
		
		this.currentLocation = position;
	},

	//ugly but 'the sencha way, since only views can fire events..
	locationChanged: function()
	{
		ReisRadar.app.getController('IntelligenceController').onLocationChange(this.currentLocation);
	},

	locationRetrieved: function()
	{
		ReisRadar.app.getController('RouteDefinitionController').onLocationChange(this.currentLocation);
	},

	//gets the current position
	getPosition: function()
	{
		if(Ext.os.is('Android'))
		{
			this.currentPositionHtml5();
		}
		else //IOS or browser
		{
			this.currentPositionSencha();
		}
	},

	//get current position the html5 way
	currentPositionHtml5: function()
	{
		var scope = this;
		//use html5 geolocation instead of buggy sencha code
		navigator.geolocation.getCurrentPosition(
				function(position)
				{
					if(position.coords.latitude != scope.currentLocation.coords.latitude || 
						position.coords.longitude != scope.currentLocation.coords.longitude){
						
						scope.currentLocation = position;
						scope.locationRetrieved();
					}				
				},
				function(err)
				{
					console.log('cannot find location');
				},
				{
					enableHighAccuracy: true,
					timeout: 30000,
					maximumAge: 0
				}
		);
	},
	
	//get current position the sencha way
	currentPositionSencha: function()
	{
		Ext.device.Geolocation.getCurrentPosition({
			scope: this,
		timeout: 30000,
		success: function(position)
		{
			if(position.coords.latitude != this.currentLocation.coords.latitude || 
						position.coords.longitude != this.currentLocation.coords.longitude){
						
					this.currentLocation = position;
					this.locationRetrieved();
				}		
		},
		failure: function(e) {
			console.log('cannot find location');
				}
		});
	},


	//watches location, fires event when location is changed
	watchPosition: function()
	{
		console.log('watch');
		this.stopWatch();

		if(Ext.os.is('Android'))
		{
			this.watchHTML5();
		}
		else //IOS or browser
		{
			this.watchSencha();
		}
	},

	//stops watching location
	stopWatch: function()
	{
		if(Ext.os.is('Android'))
		{
			if(this.wpid != undefined)
			{
				navigator.geolocation.clearWatch(this.wpid);
				this.wpid == undefined;
			}
		}
		else //IOS or browser
		{
			Ext.device.Geolocation.clearWatch();
		}
	},
	
	//circumvent Sencha abstraction layer
	watchHTML5: function()
	{
		//try to get a new position every 30 seconds,
		//cached locations accepted
		var scope = this;
		this.wpid = navigator.geolocation.watchPosition(
				function(position)
				{
					if(position.coords.latitude != scope.currentLocation.coords.latitude || 
						position.coords.longitude != scope.currentLocation.coords.longitude){
						
						scope.currentLocation = position;
						scope.locationChanged();
					}	
				},
				function(error)
				{
					console.log('location check went wrong: ' + error.message);
				},
				{
					enableHighAccuracy: true,
					maximumAge: 30000,
					timeout	  : 27000,
				}
		);
	},
	
	//watch position using the Sencha abstraction layer
	watchSencha: function()
	{
		Ext.device.Geolocation.watchPosition({
			frequency: ReisRadar.util.Config.config.updateDelay,
			scope: this,
			callback: function(position) {

				if(position.coords.latitude != this.currentLocation.coords.latitude || 
						position.coords.longitude != this.currentLocation.coords.longitude){
						
					this.currentLocation = position;
					this.locationChanged();
				}
			},
			failure: function() {
				console.log('location check went wrong!');
			}
		});
	}
});


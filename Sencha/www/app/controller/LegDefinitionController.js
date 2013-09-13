//Responsible for adding legs to the current itinerary.
//Responsible for showing the map of the current itinerary, including the newly added leg.

Ext.define('ReisRadar.controller.LegDefinitionController', {

	extend: 'Ext.app.Controller',
	requires: ['Ext.MessageBox','ReisRadar.util.Config','ReisRadar.util.Util', 'ReisRadar.model.Modality'],
	
	config: {

		views:[
			'ReisRadar.view.LegDefinitionView'
		],

		refs: {
			main: 'main',//refers to xtype main
			lfview: 'legdefinitionview',
			//routeMap: 'legdefinitionview #routeMap',
			rMap: 'intelligencecomposer #ldmap',
			destinationField: 'legdefinitionview #destinationfield',
			mode: 'legdefinitionview #modalitySelector'
		},

		control: {

			lfview: //refers to xtype RouteFilterView
			{
				activate: 'onDefineLeg'
			},
			
			'button[action=doLegAdd]':
			{
				tap: 'onDoLegAdd'
			},

			'button[action=backToRouteDef]':
			{
				tap: 'goBack'
			},

			/*routeMap:
			{
				maprender: 'onRouteRender'
			},*/

			destinationField:
			{
					change: 'onDestinationChange'
			},

			mode:
			{
					toggle: 'onToggleMode'
			}
		}
	},

	//onInit
	onDefineLeg: function()
	{
		if(ReisRadar.app.activeItinerary == undefined){return;}

		this.addr_destination = undefined;
		this.point_destination = undefined;
		this.tmode = ReisRadar.util.Config.config.defaultModality;
		
		this.getDestinationField().setValue('');
		var selector = this.getMode();
		selector.setPressedButtons([]);
		var pressed = selector.query('#'+this.tmode.name)[0];
		selector.setPressedButtons([pressed]);
		
		this.fitActive = false;

		this.initMap();

	},
	
	//init the leaflet map
	initMap: function()
	{
		if(ReisRadar.app.activeItinerary.point_origin != undefined)
		{
				var aMap = Leaflet.map('ldmap',{ zoomControl: false, dragging: false, touchZoom: false, keyboard: false, scrollWheelZoom: false, doublClickZoom: false });
			
				var tileUrl = 'http://a.tiles.mapbox.com/v3/bertspaan.map-u2d6u6o8/{z}/{x}/{y}.png';
				//var tileUrl = 'http://tiles.citysdk.waag.org/v2/citysdk/{z}/{x}/{y}.png';
				var osmAttrib = 'Map data © OpenStreetMap contributors';
				// Base maps ===============
				var tileLayer = new Leaflet.TileLayer(tileUrl, {
					minZoom: 4 
					, maxZoom: 20,
				    opacity: 1,
				    attribution: osmAttrib
				}).addTo(aMap);

				var markers = new Leaflet.LayerGroup();
				this.markers = markers;

				var point = ReisRadar.app.activeItinerary.point_origin;
				var origObj = new Leaflet.LatLng(point.latitude, point.longitude);

				aMap.setView(origObj, 15, true ); //set to the right position

				this.theMap = aMap;

				var map = this.theMap;
				var scope = this;

				setTimeout(function(){
					map.invalidateSize();
					scope.drawMarkers(false);
				},200); //just to be sure

		}
	},
	
	//draw all markers on the leaflet map
	drawMarkers: function(focus_destination)
	{
		console.log(focus_destination);
		if(this.markers == undefined)
		{
			return;
		}

		this.markers.clearLayers(); //start out fresh

		var point = ReisRadar.app.activeItinerary.point_origin;
		var origObj = new Leaflet.LatLng(point.latitude, point.longitude);
		
		this.markers.addLayer(Leaflet.marker([point.latitude, point.longitude])).addTo(this.theMap);

		var legs = this.previewLegs();
		var points = [];
		points.push(origObj);

		for(var i = 0; i < legs.length; i++)
		{
			var leg = legs[i];
			if(leg.point_destination != undefined){
				
				var destinationObj = new Leaflet.LatLng(leg.point_destination.latitude, leg.point_destination.longitude);
				this.markers.addLayer(Leaflet.marker(destinationObj)).addTo(this.theMap);
				points.push(destinationObj);

				// create a red polyline from an arrays of LatLng points
				var latlngs = [origObj,destinationObj];	
				// zoom the map to the polyline
				if(i > 0)	
				{
					var prev_leg = ReisRadar.app.activeItinerary.legs[i-1];
					var prevObj = new Leaflet.LatLng(prev_leg.point_destination.latitude, prev_leg.point_destination.longitude);
					latlngs = [prevObj,destinationObj]; 
				}
				var polyline = this.markers.addLayer(Leaflet.polyline(latlngs, {color: '#699'}).addTo(this.theMap));
			}
		}

		if(points.length > 1 && focus_destination == false)
		{
			var bounds = new Leaflet.LatLngBounds(points);
			this.theMap.fitBounds(bounds);
			console.log('fitbounds');
		}
		else if(focus_destination)
		{
			var destObj = new Leaflet.LatLng(this.point_destination.latitude, this.point_destination.longitude);
			this.theMap.setView(destObj, 15, true ); //set to the right position
		}

	},

	onDoLegAdd: function()
	{
		if(this.addr_destination != undefined && this.point_destination != undefined 
				&& this.tmode != undefined)
		{

			var legIndex =  ReisRadar.app.activeItinerary.legs.length;
			var legId ='leg_' + legIndex; 
			
			var leg = new Object;
			leg.id = legId;
			leg.tmode = this.tmode;
			leg.addr_destination = this.addr_destination;
			leg.point_destination = this.point_destination;
			
			ReisRadar.app.activeItinerary.legs.push(leg);
			
			console.log(leg.tmode);
			if(leg.tmode == 'OV' || leg.tmode == "Trein")
			{
				console.log('validate');
				this.validateLeg(leg);
			}	
			
			var navigation = this.getMain();
			navigation.remove(navigation.items.get(2));
			navigation.insert(2, Ext.create('ReisRadar.view.RouteDefinitionView'));
			navigation.animateActiveItem(2,{type:'slide',direction:'down'});
		}
	},

	//validates if there are known ptlines in the leg
	validateLeg: function(active_leg)
	{
		var url = ReisRadar.util.Config.config.baseUrl + '/route/validate'	
	
		for(var i = 0; i < ReisRadar.app.activeItinerary.legs.length; i++)
		{
			var leg = ReisRadar.app.activeItinerary.legs[i];
			if(leg != active_leg)
			{
				continue;
			}

			var origin = ReisRadar.app.activeItinerary.point_origin;
			console.log(ReisRadar.app.activeItinerary);
			
			var addr_start = ReisRadar.app.activeItinerary.addr_origin;
			var addr_destination = this.addr_destination;

			if( i > 0 )
			{
				origin = ReisRadar.app.activeItinerary.legs[i-1].point_destination;
				addr_start = ReisRadar.app.activeItinerary.legs[i-1].addr_destination;
			}
			var destination = leg.point_destination;
			var geometry = ReisRadar.util.Util.createMultiPoint(origin, destination);

			var config = {
				url: url,
				method: 'POST',
				withCredentials: false,
				useDefaultXhrHeader: false,
				scope:this,
				params:
				{
					geo_relevance: JSON.stringify(geometry),
					tmode: leg.tmode,
					leg_id: leg.id,
					address_start: addr_start,
					address_destination: addr_destination
				},
				callback: function(options,success,response)
				{
					this.getMain().setMasked(false);
					if(success)
					{
						var lines = JSON.parse(response.responseText);
						if(lines.length == 0)
						{
							ReisRadar.util.Util.showAlert(ReisRadar.util.Messages.ERROR_LEG,ReisRadar.util.Messages.ERROR_LEG_MESSAGE);
						}
						else
						{
							console.log(lines);
						}
					}
					
				}	
			};

			Ext.Ajax.request(config);
		}
	},

	goBack: function()
	{
		var navigation = this.getMain();
		navigation.animateActiveItem(2,{type:'slide',direction:'down'});
	},
	
	//fires when the destination has changed
	onDestinationChange: function(sender,newValue,oldValue,opts)
	{
		if(newValue != '')
		{
			this.geoCode(newValue);
		}
	},
	
	//fires when tmode is changed
	onToggleMode: function(sender,button,isPressed,opts)
	{
		if(isPressed){
			var tmode = button.config.itemId;
			this.tmode = tmode;
		}
	},

	//ask google for a geo position on the entered destination,
	geoCode: function(value)
	{

		this.getMain().setMasked({xtype:'loadmask',message: ReisRadar.util.Messages.PROCESSING_DESTINATION});	
		var geocoder = new google.maps.Geocoder();
		var scope = this; //workaround for not being able to set the scope on callback

		if (geocoder) {
			geocoder.geocode({ 'address': value }, function (results, status) {
						
				scope.getMain().setMasked(false);
				if (status == google.maps.GeocoderStatus.OK) {
					var loc = results[0].geometry.location;
					scope.onGeoCodeSuccess(loc,value);
				}
				else 
				{
					ReisRadar.util.Util.showAlert(ReisRadar.util.Messages.NOTIFICATION,ReisRadar.util.Messages.DESTINATION_ERROR);
				}
			});
		}
	},
	
	//on geocode success, save the destination to the local variable
	onGeoCodeSuccess: function(location,value)
	{
		var point = new Object;
		point.latitude = location.lat();
		point.longitude = location.lng();
		
		this.point_destination = point;
		this.addr_destination = value;
		console.log(this.addr_destination);
		//add it already, we'll remove it on cancel.. or user may delete it later
		
		this.updateMap(true);
	},

	//replace the map with the new locations etc
	updateMap: function(focus_destination)
	{
		this.drawMarkers(focus_destination);	
	},

	//injects a leg into a copy the itinerary legs 
	previewLegs: function()
	{
		var legs = ReisRadar.app.activeItinerary.legs;	
		if(this.addr_destination != undefined && this.point_destination != undefined 
				&& this.tmode != undefined)
		{
			var leg = new Object;
			leg.tmode = this.tmode;
			leg.addr_destination = this.addr_destination;
			leg.point_destination = this.point_destination;
			legs = legs.concat(leg);
		}
		return legs;
	},

});

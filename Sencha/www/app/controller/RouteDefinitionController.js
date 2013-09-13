/* class responsible for creating and importing and managing itineraries from user input and device status*/
//MAX legs is 10
Ext.define('ReisRadar.controller.RouteDefinitionController', {
	
	extend: 'Ext.app.Controller',
	
	requires: ['ReisRadar.util.Locator', 'Ext.MessageBox','ReisRadar.util.Config','ReisRadar.util.Util'],
	
	config: {

		views:[
			'ReisRadar.view.RouteDefinitionView',
			'ReisRadar.view.LegDefinitionView',
			'ReisRadar.view.LegItemView',
		],

		refs: {
			main: 'main',//refers to xtype main
			nameField: 'routedefinitionview #nameField', 
			originField: 'routedefinitionview #originfield',
			rfview: 'routedefinitionview',
			legs: 'routedefinitionview #legs'
		},

		control: {

			rfview: //refers to xtype RouteFilterView
			{
				activate: 'onActivate'
			},
			
			'button[action=doConfirm]':
			{
				tap: 'onDoConfirm'
			},

			'button[action=deleteRoute]':
			{
				tap: 'deleteRoute'
			},

			'button[action=addLeg]':
			{
				tap: 'onAddLeg'
			},

			'button[action=deleteLeg]':
			{
				tap: 'onDeleteLeg'
			},
			
			originField:
			{
				change: 'onOriginChange'
			},

			nameField:
			{
				change: 'onNameChange'
			}

		}
	},

	deleteRoute: function()
	{
		console.log('delete this route');
		Ext.Msg.confirm(ReisRadar.util.Messages.TRASH, ReisRadar.util.Messages.CONFIRM_TRASH, function(answer){ 
			if(answer=='yes') { 
				var store = Ext.getStore('ItineraryStore');
				var recordIndex = store.find('name',ReisRadar.app.activeItinerary.name);
				store.removeAt(recordIndex);
				store.sync();
				var navigation = this.getMain();
		                navigation.animateActiveItem(4, {type:'slide',direction:'down'});
			} 
		}, this);
		
		

	},

	//fired by locator
	onLocationChange: function(position)
	{
		console.log('onlocationchange');
		var origin = position.coords;
		ReisRadar.app.activeItinerary.point_origin = origin;
		this.reverseGeoCode(origin);
	},

	reverseGeoCode: function(position)
	{
		this.getMain().setMasked({xtype:'loadmask',message: ReisRadar.util.Messages.PROCESSING_LOCATION});    
		var geocoder = new google.maps.Geocoder();
		var scope = this; //workaround for not being able to set the scope on callback

		if(geocoder)
		{
			var value = new google.maps.LatLng(position.latitude,position.longitude);
			geocoder.geocode({ 'latLng': value }, function (results, status) {
				scope.getMain().setMasked(false);
				if (status == google.maps.GeocoderStatus.OK) {
					var address = results[0].formatted_address;
					scope.getOriginField().setValue(address);
					//scope.updateMap();
				}
				else 
				{
				ReisRadar.util.Util.showAlert(ReisRadar.util.Messages.NOTIFICATION,ReisRadar.util.Messages.ERROR_LOCATION);
				}
			});
		}
	},

	//onInit
	onActivate: function()
	{
		//load the active itinerary
		if(ReisRadar.app.activeItinerary)
		{
			//set origin
			if(ReisRadar.app.activeItinerary.addr_origin != undefined){
				//display the origin in the origin field
				this.getOriginField().setValue(ReisRadar.app.activeItinerary.addr_origin);
			}
			else
			{
				this.updateOrigin();
			}
			this.getOriginField().setValue(ReisRadar.app.activeItinerary.addr_origin);

			var legsContainer = this.getLegs();
			legsContainer.removeAll();
			for(var i = 0; i < ReisRadar.app.activeItinerary.legs.length; i++)
			{
				var leg = ReisRadar.app.activeItinerary.legs[i];

				if(leg.addr_destination)
				{
					var legView = Ext.create('ReisRadar.view.LegItemView');
					var legId ='leg_' + i; 
					legView.setItemId(legId);
					legView.setData(leg.addr_destination, leg.tmode);
					legsContainer.add(legView);
				}
			}

			//set name
			this.getNameField().setValue(ReisRadar.app.activeItinerary.name);
		}
	},


	//button to add a leg to the route has been pushed
	onAddLeg: function()
	{
		var legsContainer = this.getLegs();
		var legIndex = 	legsContainer.items.length;
		if(legIndex >= ReisRadar.util.Config.config.maxLegs)
		{
			ReisRadar.util.Util.showAlert(ReisRadar.util.Messages.NOTIFICATION,ReisRadar.util.Messages.MAX_DEST_REACHED);
			return;
		}

		var navigation = this.getMain();
		navigation.remove(navigation.items.get(5));
		navigation.insert(5, Ext.create('ReisRadar.view.LegDefinitionView'));

		navigation.animateActiveItem(5, {type:'slide',direction:'up'});

	},

	onDeleteLeg: function(button, e, opts)
	{
		var legView = button.parent;
		var legsContainer = this.getLegs();
		
		var legIndex = -1;
		for(var i = 0; i < ReisRadar.app.activeItinerary.legs.length; i++)
		{
			var view = legsContainer.getAt(i);
			if(view == legView)
			{
				legIndex = i;
				break;
			}
		}

		if(legIndex >= 0)
		{
			var leg = ReisRadar.app.activeItinerary.legs[legIndex];
			ReisRadar.app.activeItinerary.legs.splice(legIndex,1);
		
			//remove leg view from container
			legsContainer.removeAt(legIndex);
		}
	},



	//update origin, when successful, update intelligence
	updateOrigin: function()
	{

		var position = ReisRadar.util.Locator.currentLocation;
              	this.onLocationChange(position);
		ReisRadar.util.Locator.getPosition(); //will only fire if really changed, then it will override the current location		
	},
	
	onOriginChange: function(sender,newValue,oldValue,opts)
	{
		var legId = 'origin';
		if(newValue != '' && newValue != ReisRadar.app.activeItinerary.addr_origin)
		{
			this.geoCode(newValue,legId);
		}
	},

	onNameChange: function(sender, newValue, oldValue, opts)
	{
		
		if(newValue != '' && newValue != ReisRadar.app.activeItinerary.name)
		{
			ReisRadar.app.activeItinerary.name = newValue;
		}

	},

	//get a route for each leg from the citysdk API
	selectRoutes: function()
	{
		var url = ReisRadar.util.Config.config.baseUrl + '/route/select'	
	
		for(var i = 0; i < ReisRadar.app.activeItinerary.legs.length; i++)
		{
			var leg = ReisRadar.app.activeItinerary.legs[i];
			var origin = ReisRadar.app.activeItinerary.point_origin;
			if( i > 0 )
			{
				origin = ReisRadar.app.activeItinerary.legs[i-1].point_destination;
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
					leg_id: leg.id		
				},
				callback: function(options,success,response)
				{
					this.getMain().setMasked(false);
					if(success)
					{
						var route = JSON.parse(response.responseText);
						this.checkRoutes(route);
					}
					else
					{
						leg.node = 'fail';
					}
				}	
			};

			Ext.Ajax.request(config);
		}	
	},

	//ask google for a geo position on the entered destination,
	geoCode: function(value,legId)
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
				ReisRadar.util.Util.showAlert(ReisRadar.util.Messages.NOTIFICATION,ReisRadar.util.Messages.ERROR_LOCATION);
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
		ReisRadar.app.activeItinerary.point_origin = point;
		ReisRadar.app.activeItinerary.addr_origin = value;
	},
		
	//called by selectRoutes callbacks, 
	//should check if every leg has an associated citysdk id.
	//when every leg has an associated city sdk id, we're done
	checkRoutes: function(route)
	{
		var success_count = 0;
		var done_count = 0;

		for(var i = 0; i < ReisRadar.app.activeItinerary.legs.length; i++)
		{
			var leg = ReisRadar.app.activeItinerary.legs[i];
			
			if(route.leg_id == leg.id)
			{
				//succesful node
				leg.node = route.cdk_id;
			}
			
			if(leg.node != undefined)
			{
				done_count++;
			}
		}

		if(done_count >= ReisRadar.app.activeItinerary.legs.length)
		{
			this.saveItinerary();
			var navigation = this.getMain();
			navigation.animateActiveItem(0, {type:'slide',direction:'up'});
		}
		else
		{
			console.log('not done yet: ' + done_count + " of: " + ReisRadar.app.activeItinerary.legs.length);
		}
	},

	//User has pushed the confirm button	
	onDoConfirm: function()
	{
		var name = this.getNameField().getValue();

		if(name == undefined || name == '')
		{
			ReisRadar.util.Util.showAlert(ReisRadar.util.Messages.NOTIFICATION, ReisRadar.util.Messages.ERROR_NAME);
			return;
		}
		
		ReisRadar.app.activeItinerary.name = name;

		if( ReisRadar.app.activeItinerary.legs.length > 0 
				&& ReisRadar.app.activeItinerary.legs[0].point_destination != undefined )
		{
			this.selectRoutes();
		}
		else
		{
			ReisRadar.util.Util.showAlert(ReisRadar.util.Messages.NOTIFICATION, ReisRadar.util.Messages.ERROR_DESTINATION_EMPTY);
		}
	},

	//saves the itinerary to the store
	saveItinerary: function()
	{
		console.log("SAVE");	
		var store = Ext.getStore('ItineraryStore');
		store.setAutoSync(true);
		console.log("save: " + ReisRadar.app.activeRecord);
		
		if(ReisRadar.app.activeRecord != undefined)
		{
			//var recordIndex = store.find('name',ReisRadar.app.activeItinerary.name,0,false,true,true);
			var recordIndex = store.find('localId',ReisRadar.app.activeRecord,0,false,true,true);
			if(recordIndex >= 0)
			{
				//create new record
				store.removeAt(recordIndex);
				store.sync();
				console.log("removed!");
			}
		}

		//create the model
		var itinerary = Ext.create('ReisRadar.model.Itinerary', {
			name: ReisRadar.app.activeItinerary.name,
		    	data: ReisRadar.app.activeItinerary
		});
		
		store.add(itinerary);
		store.sync();
		console.log("added!");
	}

});

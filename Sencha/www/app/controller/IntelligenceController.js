//responsible for controlling the actions of the Intelligence View

Ext.define('ReisRadar.controller.IntelligenceController',
{
	extend: 'Ext.app.Controller',
	
	requires: ['ReisRadar.util.Locator', 'Ext.MessageBox','Ext.util.DelayedTask','ReisRadar.util.Config','ReisRadar.util.Util','ReisRadar.model.Modality'],

	config:
	{
		views:
		[		
			'ReisRadar.view.IntelligenceView',
			'ReisRadar.view.MessageView'
		],

		refs: {
			main: 'main',
			bar: '#destination_title',
			legs: 'intelligenceview #legsContainer'
		},

		control:
		{

			intelligenceview: 
			{
				show: 'onShow'
			},
								
			//filter
			'button[action=back]': 
			{
				tap: 'goBack'
			},

			//compose
			'button[action=add]':
			{
				tap: 'doAdd'
			},

			'button[action=selectRoutes]':
			{
				tap: 'doSelectRoutes'
			},
			
			//update
			'button[action=refresh]':
			{
				tap: 'doRefresh'
			},

			messageview:
			{
				comment: 'onComment'
			}
		}
	},

	//HACK: called by locator directly
	onLocationChange: function(position)
	{
		if(ReisRadar.app.activeItinerary.legs.length > 0){
			this.determineActiveLeg(position);
			ReisRadar.app.activeLegPosition = position; 			
		}
	},
	
	//reply to data
	onComment: function(view, data)
	{
		ReisRadar.app.currentReplyData = data;
		this.doReply();
	},

	doSelectRoutes: function()
	{
		ReisRadar.util.Locator.stopWatch();
		var navigation = this.getMain();
		navigation.animateActiveItem(4, {type:'slide',direction:'down'});
	},
	
	onShow: function()
	{

		//look at the current filter, if it is undefined, create a default filter based on the current location
		if(ReisRadar.app.activeItinerary == undefined)
		{
			var itinerary = new Object;
			itinerary.name = 'default';
			itinerary.legs = [];
			ReisRadar.app.activeItinerary = itinerary;
			ReisRadar.app.activeRadius = ReisRadar.util.Config.config.defaultRadius;
			ReisRadar.app.activeInterval = ReisRadar.util.Config.config.defaultInterval;
		}
		else if(ReisRadar.app.activeItinerary.point_origin)
		{
			console.log(ReisRadar.app.activeItinerary.name);
			var titleBar = this.getBar();
			console.log(titleBar);
			titleBar.setTitle(ReisRadar.app.activeItinerary.name);
			//kick off the location watch
			ReisRadar.util.Locator.watchPosition();
			this.updateIntelligence();
			this.determineActiveLeg(ReisRadar.util.Locator.currentLocation);
		}

	},
		
	//determines the active leg, by calculating the distance 
	//between the current position and all the destinations (including the origin).
	determineActiveLeg: function(position)
	{
		if(position == undefined)
		{
			return;
		}

		var smallest_index = -1;
		var smallest_distance = 1000;

		//step 1. calculate closest leg ( shortest distance between leg line and current position)
		for(var i = 0; i < ReisRadar.app.activeItinerary.legs.length; i++)
		{
			var destination = ReisRadar.app.activeItinerary.legs[i].point_destination;
			var origin = ReisRadar.app.activeItinerary.point_origin;
			if(i > 0)	
			{
				origin = ReisRadar.app.activeItinerary.legs[i-1].point_destination;
			}
			
			var perpDistance = ReisRadar.util.Util.calculatePerpendicularDistance(position.coords, origin, destination);	
			if(smallest_index == -1 || perpDistance < smallest_distance)
			{ 
				smallest_index = i;
				smallest_distance = perpDistance;
			}	
		}
	
		//step 2. if ov, check to see if point is within radius of leg origin, if true, previous leg is still active
		var modality = ReisRadar.app.activeItinerary.legs[smallest_index].tmode;
		if(modality == ReisRadar.model.Modality.PT.name || modality == ReisRadar.model.Modality.RAIL.name)
		{
			var origin = ReisRadar.app.activeItinerary.point_origin;
			if(smallest_index > 0)	
			{
				origin = ReisRadar.app.activeItinerary.legs[smallest_index-1].point_destination;
			}
			
			var rdistance = ReisRadar.util.Util.calculateDistanceBetween(origin,position.coords);
			if(rdistance < ReisRadar.util.Config.config.checkinRadius)
			{
				if(smallest_index > 0)
				{
					smallest_index--;
				}
			} 
		}
		
		//if(smallest_distance < 0.1)
		//{	
			//step 3. update the active lega
			this.setActiveLeg(smallest_index);
		//}
	},

	//change the active leg to the specified index
	setActiveLeg: function(index)
	{
		if(ReisRadar.app.activeLegIndex == undefined || ReisRadar.app.activeLegIndex != index)
		{
			ReisRadar.app.activeLegIndex = index;

			//collapse the new active leg
			var legsContainer = this.getLegs();
			for(var i = 0; i < legsContainer.items.length; i++)
			{
				var legView = legsContainer.items.getAt(i);
				legView.close();
				legView.setHighlighted(false,false);

				if(i == index)
				{
					legView.open();
					legView.setHighlighted(true,true);
				}

				if(i == index + 1)
				{
					legView.setHighlighted(true,false);
				}
			}
		}	
	},

	doReply: function()
	{
		var navigation = this.getMain();
		navigation.remove(navigation.items.get(3));
		navigation.insert(3, Ext.create('ReisRadar.view.ReplyComposer'));
		navigation.animateActiveItem(3,{type:'slide',direction:'up'});

		if(this.currentAlias != undefined)
		{
			this.getAliasField().setValue(this.currentAlias);
		}
	},


	//refresh current location and messages
	doRefresh: function()
	{
		this.updateIntelligence();
	},
	
	//do an ajax call to get new intelligence for the current itinerary
	updateIntelligence: function()
	{
		//we want to count the number of jobs for each leg
		this.jobs = [];
		var url = ReisRadar.util.Config.config.baseUrl + '/intelligence/filter'	
			
		if(ReisRadar.app.activeItinerary.legs.length > 0)
		{
			for(var i = 0; i < ReisRadar.app.activeItinerary.legs.length; i++)
			{
				this.jobs[i] = 0;
				var tmode = ReisRadar.app.activeItinerary.legs[i].tmode;
				var names = this.sourceNamesForModality(tmode);
				
				for(var j = 0; j < names.length; j++)
				{
					var sourceName = names[j];
					this.getIntelligenceForLegAndSource(i,sourceName);
				}			
			}
		}
		this.addPois();
	},

	//maps source names to modalities, client side
	sourceNamesForModality: function(modality)
	{
		var names = [];
		names.push('buienradar');
		names.push('rr');

		switch(modality)
		{
			case ReisRadar.model.Modality.WALK.name:
				break;
			case ReisRadar.model.Modality.BIKE.name:
				break;
			case ReisRadar.model.Modality.CAR.name:
				break;
			case ReisRadar.model.Modality.PT.name:
				names.push('openov');
				break;
			case ReisRadar.model.Modality.RAIL.name:
				names.push('ns');
				break;
		}

		return names;
	},

	getIntelligenceForLegAndSource: function(legIndex,sourceName)
	{

		var url = ReisRadar.util.Config.config.baseUrl + '/intelligence/filter'	
		var leg = ReisRadar.app.activeItinerary.legs[legIndex];
		var origin = ReisRadar.app.activeItinerary.point_origin;
		var addr_start = ReisRadar.app.activeItinerary.addr_origin;
		var addr_destination = leg.addr_destination;
		
		if( legIndex > 0 )
		{
			origin = ReisRadar.app.activeItinerary.legs[legIndex-1].point_destination;
			addr_start = ReisRadar.app.activeItinerary.legs[legIndex-1].addr_destination;

			if(sourceName == "ns" || sourceName == "openov")
			{
				legIndex = legIndex - 1;
			}
		}
		
		this.jobs[legIndex]++; //increase the job number when added

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
				radius: ReisRadar.app.activeRadius,
				interval: ReisRadar.app.activeInterval, 
				tmode: leg.tmode,
				cdk_node: leg.node,
				source: sourceName,
				address_start: addr_start,
				address_destination: addr_destination
			},
			callback: function(options,success,response)
			{
				this.getMain().setMasked(false);
				if(success)
				{
					var intelligence = JSON.parse(response.responseText);
					this.processIntelligence(intelligence,legIndex,sourceName);
				}
				else
				{
					var legsContainer = this.getLegs();
					var legView = legsContainer.items.getAt(legIndex);
					legView.setLoading(false);
					legView.showWarning();
				}
			}
		};

		Ext.Ajax.request(config);
	},

	addPois: function()
	{
		var legsContainer = this.getLegs();
		legsContainer.removeAll();
			
		//add legview for origin
		var originView = Ext.create('ReisRadar.view.LegView');
		originView.setName(ReisRadar.app.activeItinerary.addr_origin);
		originView.setLoading(true);
		
		if(ReisRadar.app.activeItinerary.legs != undefined && ReisRadar.app.activeItinerary.legs.length > 0)
		{
			originView.setModality(ReisRadar.app.activeItinerary.legs[0].tmode);
		}
		else
		{
			originView.setModality('');
		}

		legsContainer.add(originView);
		legsContainer.itemId = 'leg_origin';

		//add legviews for each leg 
		for(var i = 0; i < ReisRadar.app.activeItinerary.legs.length; i++)
		{
			var leg = ReisRadar.app.activeItinerary.legs[i];
			var next_leg = ReisRadar.app.activeItinerary.legs[i+1];
			var legView = Ext.create('ReisRadar.view.LegView');

			legView.setName(leg.addr_destination);
			
			if(next_leg)
			{
				legView.setModality(next_leg.tmode);
				legView.setLoading(true);
			}

			legView.itemId = leg.id;
			legsContainer.add(legView);
		}

		//reset active leg index
		var active = ReisRadar.app.activeLegIndex;
		ReisRadar.app.activeLegIndex = undefined;
		this.setActiveLeg(active);
	},

	//process intelligence that came back from the server
	processIntelligence: function(intelligence,legIndex,sourceName)
	{
		this.jobs[legIndex]--;//decrease the number of jobs
		
		var legsContainer = this.getLegs();
		var legView = legsContainer.items.getAt(legIndex);
		
		legView.addSource(sourceName,intelligence[0]);
		
		if(this.jobs[legIndex] == 0)
		{
			legView.setLoading(false);
			if(ReisRadar.app.activeLegIndex == legIndex)
			{
				legView.open();	
			}
			else
			{
				legView.close();
			}
		}
	},

	//go back to the filter
	goBack: function()
	{
		ReisRadar.util.Locator.stopWatch();
		
		var navigation = this.getMain();
		navigation.animateActiveItem(1, {type:'slide',direction:'right'});
		//stop the locator
	},

	doAdd: function()
	{

		ReisRadar.util.Locator.stopWatch();
		
		var navigation = this.getMain();
		navigation.remove(navigation.items.get(3));
		navigation.insert(3, Ext.create('ReisRadar.view.IntelligenceComposer'));
		navigation.animateActiveItem(3,{type:'slide',direction:'up'});

		if(this.currentAlias != undefined)
		{
			this.getAliasField().setValue(this.currentAlias);
		}

	},
});

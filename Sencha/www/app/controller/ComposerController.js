//responsible for controlling the actions of the IntelligenceComposer View
Ext.define('ReisRadar.controller.ComposerController',
{
	extend: 'Ext.app.Controller',
	requires: ['Ext.MessageBox', 'ReisRadar.util.Config', 'ReisRadar.util.Util', 'ReisRadar.util.LocalStorage','Ext.device.Device'],
	config:
	{
		views: 
		[
			'ReisRadar.view.IntelligenceComposer'
		],
		
		refs: 
		{
			main: 'main',
			originMap: 'intelligencecomposer #lmap',
			aliasField: '#aliasField',
			registerButton: '#registerButton',
			sendButton: '#sendButton',
			form: 'intelligencecomposer',
			emotion: 'intelligencecomposer #emotionSelector',
		},

		control:
		{
			intelligencecomposer:
			{
				activate: 'onActivate',
			},
						
			'button[action=done]':
			{
				tap: 'onComposeDone'
			},
			
			'button[action=send]':
			{
				tap: 'onSend'
			},

			'button[action=register]':
			{
				tap: 'onRegister'
			},
		}
	},

	onActivate: function()
	{
		var orig = ReisRadar.app.activeItinerary.point_origin;
		if(ReisRadar.app.activeLegPosition != undefined)
		{
			orig = ReisRadar.app.activeLegPosition.coords;
		}
		
		this.addMap(orig); 
		
		if(ReisRadar.util.LocalStorage.getAlias() != undefined)
		{
		   this.getAliasField().setValue(ReisRadar.util.LocalStorage.getAlias());
		   this.getAliasField().setDisabled(true);
		   this.getRegisterButton().setHidden(true);
		}
		else
		{
			this.getSendButton().setDisabled(true);
		}
	},

	//adds a leaflet map to the view
	addMap: function(point)
	{
		//get the element we are going to inject the map into
		var lmap = this.getOriginMap();
		var map = Leaflet.map('lmap',{ zoomControl: false, dragging: false, touchZoom: false, keyboard: false, scrollWheelZoom: false, doublClickZoom: false });
		var tileUrl = 'http://tiles.citysdk.waag.org/v2/citysdk/{z}/{x}/{y}.png';

		var tileUrl = 'http://a.tiles.mapbox.com/v3/bertspaan.map-u2d6u6o8/{z}/{x}/{y}.png';
		var osmAttrib = 'Map data © OpenStreetMap contributors';
		// Base maps ===============
		var tileLayer = new Leaflet.TileLayer(tileUrl, {
			minZoom: 8, maxZoom: 16,
		    opacity: 1,
		    attribution: osmAttrib
		}).addTo(map);

		map.setView(new Leaflet.LatLng(point.latitude, point.longitude), 15, true ); //set to the right position
		var marker = Leaflet.marker([point.latitude, point.longitude]).addTo(map);

		setTimeout(function(){map.invalidateSize()},100); //just to be sure
	},

	onRegister: function()
	{
		var alias = this.getAliasField().getValue();
		if(alias != undefined && alias.length > 0)
		{
			//create a password from alias and some random stuff
			var password = this.createPassword(alias);

			//register the alias with the given password
			var url = ReisRadar.util.Config.config.baseUrl + '/member/register'	
			var config = {
				url: url,
				method: 'POST',
				withCredentials: false,
				useDefaultXhrHeader: false,
				scope:this,
				params:
				{
					username: alias,
					password: password,
				},
				callback: function(options,success,response)
				{
					this.getMain().setMasked(false);
					if(success)
					{
						var available = response.responseText;
						if(available == 'false')
						{
							ReisRadar.util.Util.showAlert(ReisRadar.util.Messages.NOTIFICATION, ReisRadar.util.Messages.ALIAS_TAKEN);	
						}
						else
						{
							//save alias and password
							ReisRadar.util.LocalStorage.setAlias(alias);
							ReisRadar.util.LocalStorage.setPassword(password);
							this.getAliasField().setDisabled(true);
		   					this.getRegisterButton().setHidden(true);
							this.getSendButton().setDisabled(false);
						}
					}
					else
					{
						ReisRadar.util.Util.showAlert(ReisRadar.util.Messages.NOTIFICATION,ReisRadar.util.Messages.ALIAS_ERROR);
					}
				}
			};
			this.getMain().setMasked({xtype:'loadmask',message: ReisRadar.util.Messages.PROCESSING_REGISTRATION});	
			Ext.Ajax.request(config);
		}
	},

	//generates password from device id hashed with username,
	//if no device exists, generates a random password
	createPassword: function(alias)
	{
		var deviceId = Ext.device.Device.uuid;
		if(deviceId == 'anonymous')
		{
			//generate something else that is random
			deviceId = Math.random().toString(36).substring(7); 
		}

		var hash = md5(deviceId + alias);
		return hash;
	},

	onComposeDone: function()
	{
		var navigation = this.getMain();
		navigation.animateActiveItem(0,{type:'slide',direction:'down'});
	},

	onSend: function()
	{
		this.onGeoLocationSuccess(ReisRadar.app.activeItinerary.point_origin);
	},

	onGeoLocationSuccess: function(position)
	{
		var values = this.getForm().getValues();
		var body = values['body'];
		var alias = ReisRadar.util.LocalStorage.getAlias();
		var token = ReisRadar.util.LocalStorage.getPassword();

		var emoIndex = 0;
		this.currentAlias = alias;

		//create geojson version of position
		var geometry = ReisRadar.util.Util.pointToGeoJSON(position);
		var url = ReisRadar.util.Config.config.baseUrl + '/intelligence'	

		var node = "";
		if(ReisRadar.app.activeItinerary.legs.length > 0)
		{
			if(ReisRadar.app.activeLegIndex != undefined)
			{
				var leg = ReisRadar.app.activeItinerary.legs[ReisRadar.app.activeLegIndex];
				node = leg.node;
				if(ReisRadar.app.activeLegPosition != undefined)
				{
					geometry = ReisRadar.util.Util.pointToGeoJSON(ReisRadar.app.activeLegPosition.coords);
				}
			}
			else
			{
				node = ReisRadar.app.activeItinerary.legs[0].node;
			}
		}

		//ajax send request
		var config = {
			url: url,
			method: 'POST',
			withCredentials: false,
			useDefaultXhrHeader: false,
			scope:this,
			params:
			{
				message: body,
				source: alias,
				geo_relevance: geometry,
				cdk_node: node,
				emotion: emoIndex,
				token: token
			},
			callback: function(options,success,response)
			{
				this.getMain().setMasked(false);
				if(success)
				{
					this.onComposeDone();
				}
				else
				{
					ReisRadar.util.Util.showAlert(ReisRadar.util.Messages.NOTIFICATION,ReisRadar.util.Messages.COMMENT_ERROR);
				}
			}
		};

		this.getMain().setMasked({xtype:'loadmask',message: ReisRadar.util.Messages.PROCESSING_COMMENT});	
		Ext.Ajax.request(config);
		}
});

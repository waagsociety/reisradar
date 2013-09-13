//<debug>
Ext.Loader.setPath({
	'Ext': 'touch/src',
	'ReisRadar': 'app'
});
//</debug>

Ext.application({

	//namespace
	name: 'ReisRadar',

	//id of the active itinerary
	activeItinerary: null,

	//requires
	requires: [
	'Ext.MessageBox',
	'ReisRadar.util.Messages'
	],

	icon: {
		'57': 'resources/icons/Icon.png',
	'72': 'resources/icons/Icon~ipad.png',
	'114': 'resources/icons/Icon@2x.png',
	'144': 'resources/icons/Icon~ipad@2x.png'
	},

	isIconPrecomposed: true,

	startupImage: {
		'320x460': 'resources/startup/320x460.jpg',
		'640x920': 'resources/startup/640x920.png',
		'768x1004': 'resources/startup/768x1004.png',
		'748x1024': 'resources/startup/748x1024.png',
		'1536x2008': 'resources/startup/1536x2008.png',
		'1496x2048': 'resources/startup/1496x2048.png'
	},
	
	//Dependencies 
	
	models: [
		'Itinerary',
		],

	views: [
		'Main',
		'FilterView',
		'RouteDefinitionView',
		'LegView',
		'SourceView',
		'MessageView',
		'CommentView',
		'IntelligenceView',
		'IntelligenceComposer'
		],

	controllers: 
		[
		'FilterController',
		'IntelligenceController',
		'RouteDefinitionController',
		'LegDefinitionController',
		'RouteSelectionController',
		'ComposerController',
		'ReplyController',
		],

	stores: [
		'ItineraryStore',
		],


	launch: function() {
		// Destroy the #appLoadingIndicator element
		Ext.fly('appLoadingIndicator').destroy();
		
		var main = Ext.create('ReisRadar.view.Main');	
		
		// Initialize the main views
		Ext.Viewport.add(main);

		
		//show the selection of routes as first panel
		main.animateActiveItem(4, {type:'slide',direction:'down'});
	},

	onUpdated: function() {
		Ext.Msg.confirm(
				"Application Update",
				"This application has just successfully been updated to the latest version. Reload now?",
				function(buttonId) {
					if (buttonId === 'yes') {
						window.location.reload();
					}
				}
			       );
	}
});

//this view is the main view, and contains all other views
//the controller of this view is responsible for switching between
//subviews
Ext.define('ReisRadar.view.Main', {
    extend: 'Ext.Panel',
    xtype: 'main',
    requires: [
        'ReisRadar.view.FilterView',
        'ReisRadar.view.IntelligenceView',
	'ReisRadar.view.RouteDefinitionView',
	'ReisRadar.view.IntelligenceComposer',
	'ReisRadar.view.RouteSelectionView',
	'ReisRadar.view.LegDefinitionView'
    ],
    config: {
	fullscreen: true,
	layout: 
	{
		type: 'card',
		animation: 
		{
			type: 'slide',
			direction: 'left',
			duration: 250
		}
	},

        items: [
		{xtype: 'intelligenceview'},{xtype: 'filterview'},{xtype: 'routedefinitionview'},{xtype: 'intelligencecomposer'},{xtype: 'routeselectionview'},{xtype: 'legdefinitionview'}
        ]
    }
});

//responsible for controlling the actions of the RouteSelectionView
Ext.define('ReisRadar.controller.RouteSelectionController',
{
	extend: 'Ext.app.Controller',
	requires: ['Ext.MessageBox','ReisRadar.util.Config','ReisRadar.util.Util','Ext.Anim'],
	config:
	{
		views: ['ReisRadar.view.RouteSelectionView'],
		refs:
		{
			main: 'main'
		},
		control:
		{
			routeselectionview:
			{
				activate: 'onShowSelection'
			},
			'button[action=addRoute]':
			{
				tap: 'doAddRoute'
			},

			list:
			{
				itemtap: 'onItemTap',
				disclose: 'onItemDisclose',
				//itemswipe: 'onItemSwipe',
			}	
		}
	},

	onShowSelection: function()
	{

		this.disclose = false;
	},

	doAddRoute: function()
	{
		var itinerary = new Object;
		itinerary.legs = [];
		ReisRadar.app.activeItinerary = itinerary;

		ReisRadar.app.activeRecord = undefined;
		console.log('active record: ' + ReisRadar.app.activeRecord);
		
		
		var navigation = this.getMain();
		navigation.remove(navigation.items.get(2));
		navigation.insert(2, Ext.create('ReisRadar.view.RouteDefinitionView'));
		navigation.animateActiveItem(2, {type:'slide',direction:'up'});
	},
	
	onItemTap: function(list, index, target, record, e, opts)
	{
		if(record != undefined && this.disclose != true)
		{
			var itinerary = record.get('data');
			ReisRadar.app.activeItinerary = itinerary;

			if(ReisRadar.app.activeItinerary.legs.length == 0)
			{
				var navigation = this.getMain();
				navigation.remove(navigation.items.get(2));
				navigation.insert(2, Ext.create('ReisRadar.view.RouteDefinitionView'));
				navigation.animateActiveItem(2, {type:'slide',direction:'up'});
			}
			else
			{
				var navigation = this.getMain();
				navigation.animateActiveItem(0,{type:'slide',direction:'up'});
			}
		}
	},

	onItemDisclose: function(list, record, target, index, e, eOpts)
	{
		this.disclose = true;

		var itinerary = record.get('data');
		ReisRadar.app.activeItinerary = itinerary;

		ReisRadar.app.activeRecord = record.get('localId');
		console.log('active record: ' + ReisRadar.app.activeRecord);
		
		var navigation = this.getMain();
		navigation.remove(navigation.items.get(2));
		navigation.insert(2, Ext.create('ReisRadar.view.RouteDefinitionView'));
		navigation.animateActiveItem(2, {type:'slide',direction:'up'});
	},
});

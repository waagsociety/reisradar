//intelligence view is responsible for displaying filtered intelligence
//toolbar at the top displays current destination
//The defaultType is an intelligence item
//
Ext.define('ReisRadar.view.IntelligenceView',
{
	extend: 'Ext.Panel',
	xtype: 'intelligenceview',

	requires: 
	[
		'ReisRadar.view.IntelligenceItem',
	],

	config:
	{
		cls:'route',
		items://subviews
		[
			{
				xtype: 'titlebar',
				docked: 'top',
				cls: 'rr_title',
				id: 'destination_title',
				items: [
				{
					xtype: 'button',
					iconCls: 'list',
					iconAlign:'left',
					action: 'selectRoutes',
					cls: 'titleButton'
				},
				]
			},
			{
				xtype: 'container',
				scrollable: true,
				layout: {type: 'vbox'},
				items: [
				{
					html:"&nbsp;",
					height: 5 
				},
				{
					xtype: 'container',
					itemId: 'legsContainer',
					items: 
					[
					]
				}
				]
			},
			{
				xtype: 'tabbar',
				docked: 'bottom',
				items: [
					{
					xtype:'container',
					layout: 'hbox',
					items:[
						{
							xtype: 'button',
							action: 'add',
							iconCls: 'balloon',
							iconMask: 'true',
							cls: 'titleButton',
							text: ReisRadar.util.Messages.INTELLIGENCE_NEW,
							margin: 10
						},
						{
							html: "|",
							style: "color:white;",
							margin: 10	
						},
						{
							xtype: 'button',
							action: 'refresh',
							iconCls: 'refresh',
							iconMask: 'true',
							text: ReisRadar.util.Messages.INTELLIGENCE_REFRESH,
							cls: 'titleButton',
							margin: 10
						},
						]
					}
					]
				}
		],
		
		//all collapse and comment listeners delegated in one nice spot
		//DO NOT REMOVE logs, it will break the app
		listeners: [ //collapse
			{
				element: 'element',
				delegate: 'div.leg',
				event: 'tap',
				fn: function(e) {
					setTimeout(function() {
						var component = Ext.getCmp(e.delegatedTarget.id);
						component.parent.collapse();
					}, 20); //with delay
				}
			},
			{
				element: 'element',
				delegate: 'div.leg_active',
				event: 'tap',
				fn: function(e) {
					setTimeout(function() {
						var component = Ext.getCmp(e.delegatedTarget.id);
						component.parent.collapse();
					}, 20); //with delay
				}
			},
			{
				element: 'element',
				delegate: 'div.messageButton',
				event: 'tap',
				fn: function(e) {
					setTimeout(function() {
						var component = Ext.getCmp(e.delegatedTarget.id);
						component.parent.parent.collapse();
					}, 20); //with delay
				}
			},
			{
				element: 'element',
				delegate: 'div.commentButton',
				event: 'tap',
				fn: function(e) {
					setTimeout(function() {
						var component = Ext.getCmp(e.delegatedTarget.id);
						component.parent.parent.parent.collapse();
					}, 20); //with delay
				}
			},
			{
				element: 'element',
				delegate: 'div.message_add_comment',
				event: 'tap',
				fn: function(e) {
					setTimeout(function() {
						var component = Ext.getCmp(e.delegatedTarget.id);
						component.parent.parent.parent.addComment();
					}, 20); //with delay
				}
			}
		],		    

		layout: 'fit'
	},

	//closes all legs
	closeLegs: function()
	{
		var legs = this.query('#legsContainer')[0];
		for(var i = 0; i < legs.items.length; i++)
		{
			var legView = legs.items.getAt(i);
			legView.close();
		}
	}
});

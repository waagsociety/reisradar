//this class shows feedback on a map on the chosen destination and current origin, and the resulting route..
Ext.define('ReisRadar.view.RouteDefinitionView',
{
	extend: 'Ext.Panel',
	xtype: 'routedefinitionview',
	requires: 'ReisRadar.view.LegDefinitionView',
	config:
	{
		fullscreen: true,
		scrollable: 'vertical',
		items: 
		[
			{
              		xtype: 'titlebar',
			title: '',
			docked: 'top',
			items: [
				{
					xtype: 'button',
					iconCls: 'back',
					iconAlign:'left',
					action: 'selectRoutes',
					text: ReisRadar.util.Messages.BACK,
					cls: 'titleButton'
				},

				{
					xtype: 'button',
					iconCls: 'trash',
					text: ReisRadar.util.Messages.TRASH,
					align: 'right',
					cls: 'titleButton',
					action: 'deleteRoute'
				}
			]
			},
			{
				xtype: 'container',
				layout: {type: 'vbox', align: 'left'},
				margin: 10,
				items: [
				{
					xtype: 'label',
					html: ReisRadar.util.Messages.NAME_LABEL,
					margin: 5,
				},
				{
					xtype: 'textfield',
					itemId: 'nameField',
					placeHolder: ReisRadar.util.Messages.NAME_PLACEHOLDER,
					clearIcon: true,
					disabled: false,
					margin: 10,
				}]
			},
			{
				xtype: 'container',
				layout: {type: 'vbox', align: 'left'},
				margin: 10,
				items: [
				{
					xtype: 'label',
					html: ReisRadar.util.Messages.ORIGIN_LABEL,
					margin: 5,
				},
				{
					xtype: 'textfield',
					itemId: 'originfield',
					placeHolder: ReisRadar.util.Messages.ORIGIN_PLACEHOLDER,
					clearIcon: true,
					disabled: false,
					margin: 10
				}]
			},
			{
				xtype: 'container',
				itemId: 'legs',
				items: [
				]
			},
			{
				xtype: 'container',
				layout: {type: 'hbox', align: 'center'},
				items:[
					
					{
						margin: 10,
						xtype: 'button',
						text: ReisRadar.util.Messages.DESTINATION_ADD,
						action: 'addLeg',
						iconCls: 'add',
						cls: 'defaultButton'
					}
				]
			},
			{ 
				xtype: 'tabbar',
				docked: 'bottom',
				items: [
				{
					//button: filter	
					xtype: 'button',
					text: ReisRadar.util.Messages.CONFIRM,
					action: 'doConfirm',
					cls: 'titleButton',
					iconCls: 'check',
					margin: 10
				}]
			}
		]
	}
});

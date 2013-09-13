//this view is responsible for showing the controls that allow the user to define a leg in the route
//sub view of the routedefinition view
Ext.define('ReisRadar.view.LegDefinitionView',
{
	extend: 'Ext.Panel',
	xtype: 'legdefinitionview',
	config:
	{
		fullscreen: true,
		items:[
			{
				xtype: 'titlebar',
				title: '',
				items: 
				[
					{
						xtype: 'button',
						iconCls: 'back',
						iconAlign:'left',
						action: 'backToRouteDef',
						text: ReisRadar.util.Messages.BACK,
						cls: 'titleButton'
					}
				]
			},

			{
				xtype: 'container',
				layout: {type: 'vbox', align: 'left'},
				items: [
					{
						xtype: 'label',
						itemId: 'nameLabel',
						html: ReisRadar.util.Messages.DESTINATION_LABEL,
						margin: 10,
					},
					{
						xtype: 'textfield',
						itemId: 'destinationfield',
						placeHolder: ReisRadar.util.Messages.DESTINATION_PLACEHOLDER,
						disabled: false,
						clearIcon: true,
						margin: 10,
					},
					{
						xtype: 'label',
						itemId: 'nameLabel',
						html: ReisRadar.util.Messages.TMODE_LABEL,
						margin: 10,
					},

					{
						xtype: 'segmentedbutton',	
						allowMultiple: false,
						itemId: 'modalitySelector',
						style: 'margin-left: auto; margin-right: auto;',//centers div horizontally
						items: [
						{
							itemId: 'Lopend',
							iconCls:'walk',
							cls: 'titleButton',
							align: 'top'
						},
						{
							itemId: 'Fiets',
							iconCls:'bike',
							cls: 'titleButton',
							align: 'top'
						},
						{
							itemId: 'Auto',
							iconCls:'car',
							cls: 'titleButton',
							align: 'top'
						},
						{
							itemId: 'OV',
							iconCls:'bus',
							cls: 'titleButton',
							align: 'top',
							pressed: true
						},
						{
							itemId: 'Trein',
							iconCls: 'train',
							cls: 'titleButton',
							align: 'top'
						}
						]
					}
				]
			},
			{
				id: 'ldmap',//leaflet map
				height: 200, //predefined height
				margin: 10,
			},
			{ 
				xtype: 'tabbar',
				docked: 'bottom',
				items: [
				{
					//button: filter	
					xtype: 'button',
					text: ReisRadar.util.Messages.DESTINATION_DONE,
					action: 'doLegAdd',
					cls: 'titleButton',
					iconCls: 'check',
					margin: 10
				}]
			}
			//toolbar
		]
	}
});

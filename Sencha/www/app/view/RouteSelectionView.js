//this view is responsible for listing the available persisted routes
Ext.define('ReisRadar.view.RouteSelectionView',
{
	extend: 'Ext.Container',
	xtype: 'routeselectionview',
	requires: ['ReisRadar.util.Messages'],
	config:
	{
		fullscreen: true,
		items:
		[{
			xtype: 'titlebar',
			docked: 'top',
			cls: 'rr_title',
			title: ReisRadar.util.Messages.ROUTE_TITLE,
			items: [
			]
		},
		{
			xtype: 'list',
			store: 'ItineraryStore',
			itemId: 'routeList',
			striped: 'true',
			border: 0,
			itemTpl: '<span><div class="name">{name}</div><div class="deleteplaceholder"></div>&nbsp;</span>',
			height: '100%',
			onItemDisclosure: true,
			allowDeselect: false
		},
		{
			xtype: 'tabbar',
			docked: 'bottom',
			items:[
				{
					xtype: 'button',
					iconCls: 'add',
					iconMask: 'true',
					align: 'right',
					action: 'addRoute',
					text: ReisRadar.util.Messages.ROUTE_NEW,
					cls: 'titleButton'
				}
			]
		}
		]
	}
});

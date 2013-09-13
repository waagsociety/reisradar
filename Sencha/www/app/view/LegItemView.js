//this view shows a defined leg in the routedefinitionview, and allows it to be deleted from the list
Ext.define('ReisRadar.view.LegItemView', {
	extend: 'Ext.Container',
	xtype: 'legitemview',
		config:
		{
			layout: 'hbox',
			items:
			[
				{
					xtype: 'button',
					html:'&nbsp;',
					itemId: 'tmodeIcon',
					iconCls: 'walk',
					cls: 'defaultButton',
					margin: 10
				},
				{
					xtype: 'container',
					style: 'position: relative;',
					flex: 1,
					items: 
					[
						{
							itemId: 'destinationLabel',
							html: 'Amsterdam Centraal Station',
							style: 'position: absolute; bottom: 1em; left: 0;'
						},
					]
				},
				
				{
					xtype: 'button',
					iconCls: 'remove',
					cls: 'defaultButton',
					align: 'right',
					action: 'deleteLeg',
					style: 'margin-bottom: 0;'
				},
				{
					xtype: 'spacer',
					width: '2em'
				}
			]
		},
		
		//set the data of this view
		setData: function(name, tmode)
		{
			var label = this.query('#destinationLabel')[0];
			label.setHtml(name);

			var icon = this.query('#tmodeIcon')[0];
			icon.setIconCls(this.classNameForTMode(tmode));
		},

		//return the class name for the given tmode
		classNameForTMode: function(tmode)
		{
			var className = tmode.cls;
			switch(tmode)
			{
				case 'Lopend':
					className = 'walk';
					break;
				case 'Fiets':
					className = 'bike';
					break;
				case 'Auto':
					className = 'car';
					break;
				case 'OV':
					className = 'bus';
					break;
				case 'Trein':
					className = 'train';
					break;
			}
			return className;
		}

});

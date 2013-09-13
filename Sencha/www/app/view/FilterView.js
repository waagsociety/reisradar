//this class represents the filter view, it allows the user to specify their route by filling in their destination.
Ext.define('ReisRadar.view.FilterView', 
{
    extend: 'Ext.Container',
    xtype: 'filterview',
 	
    requires: [
        'Ext.dataview.List',
	'Ext.field.Search',
	'Ext.picker.Picker'
    ],

    //constructor
    config:
	{
    		items://subviews
		[
		{
              		xtype: 'titlebar',
 			docked: 'top',
			title: 'Filter instellen',
		},
		{ //radius slider
			xtype: 'container',
			docked: 'top',
			layout: 'hbox',
			items:
				[
				{
					xtype: 'label',
					html: 'radius: ',
					margin: 10
				},

				{
					xtype: 'slider',
					itemId: 'radiusSlider',
					label: 'radius',
					minValue: 50,
					maxValue: 5000,
					increment: 50,
					value: 150,
					flex: 1
				},
				{
					xtype: 'label',
					itemId: 'radiusLabel',
					html: '150m.',
					margin: 10
				}
			]

		},//end radius slider
		{ //interval slider
			xtype: 'container',
			docked: 'top',
			layout: 'hbox',
			items:
				[
				{
					xtype: 'label',
					html: 'dagen:  ',
					margin: 10
				},

				{
					xtype: 'slider',
					label: 'dagen',
					itemId: 'intervalSlider',
					minValue: 1,
					maxValue: 30,
					increment: 1,
					value: 10,
					flex: 1
				},
				{
					xtype: 'label',
					itemId: 'intervalLabel',
					html: '10 dagen',
					margin: 10
				}
			]

		},//end radius slider
		
                { xtype: 'spacer' },
		{
			xtype: 'button',
			text: 'Akkoord',
			action: 'RouteAction',
			dock: 'top',
			margin: 10,
			height: 35 

		}
		],

		layout: 'fit'
	}
});

/* class responsible for creating and importing and managing itineraries from user input and device status*/
//RENAME: naar filter

Ext.define('ReisRadar.controller.FilterController', {
	
	extend: 'Ext.app.Controller',
	
	requires: ['Ext.MessageBox','Ext.TitleBar','Ext.SegmentedButton','Ext.Label','Ext.slider.Slider','Ext.tab.Bar','Ext.LoadMask','Ext.data.proxy.LocalStorage','Ext.Map'],
	
	config: {

		views:[
			'ReisRadar.view.FilterView',
		],

		refs: {
			main: 'main',//refers to xtype main
			radiusLabel: '#radiusLabel',
			intervalLabel: '#intervalLabel',
			radiusSlider: '#radiusSlider',
			intervalSlider: '#intervalSlider'
		},

		control: {

			filterview:
			{
				show: 'onShow'
			},

			'button[action=RouteAction]': 
			{
				tap: 'onGoTap'
			},

			slider: { // refers to xtype slider
				change: 'onSliderChange',
				drag: 'onSliderChange'
			}
		}
	},

	onShow: function()
	{
		if(this.active_radius == undefined)
		{
			this.active_radius = 150;
		}

		if(this.active_interval = undefined)
		{
			this.active_interval = 10;
		}
	},

	//determine how to proceed
	onGoTap: function()
	{
		var radius = this.getRadiusSlider().getValue();
		var interval = this.getIntervalSlider().getValue();

		ReisRadar.app.activeRadius = radius;
		ReisRadar.app.activeInterval = interval;

		this.applyFilter();
	},

	onSliderChange: function(field, newValue)
	{
		if(field.config.itemId == 'radiusSlider')
		{
			this.active_radius = field.getValue();
			var label = this.getRadiusLabel();
			label.setHtml(this.active_radius + 'm.');
		}

		if(field.config.itemId == 'intervalSlider')
		{
			this.active_interval = field.getValue();
			var label = this.getIntervalLabel();
			if(this.active_interval > 1){
				label.setHtml(this.active_interval + ' dagen');
			}
			else
			{
				label.setHtml(this.active_interval + ' dag');
			}

		}
	},

	applyFilter: function()
	{
			var cmp = this.getMain();
			this.getMain().setActiveItem(0);
	}
});

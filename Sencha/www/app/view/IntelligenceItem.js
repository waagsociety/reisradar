//Represents an intelligence item
Ext.define("ReisRadar.view.IntelligenceItem",{
	extend: 'Ext.dataview.component.ListItem',
	xtype: 'intelligenceitem',

	config: 
	{
		dataMap: 
		{
			getBody: 
			{
				setHtml: 'body'
			}
		},

		layout: 
		{
			type: 'vbox'
		},
	}
});

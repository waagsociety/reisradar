//app wide configuration
Ext.define('ReisRadar.util.Config', {

	singleton: true,
	requires: 'ReisRadar.model.Modality',
	config: 
	{
		baseUrl: 'http://reisradar.waag.org',
		maxLegs: 10,
		legNames: ['B','C','D','E','F','G','H','I','J','K'],
		sourceNames: ["ns","openov","rr","buienradar"],
		defaultRadius: 150,
		defaultInterval: 10,
		updateDelay: 30000, //watch for new location every 30 seconds,
		checkinRadius: 500,
		defaultModality: 3 //public transport
	},
	
	//override constructor
	constructor: function(config) 
	{
		this.initConfig(config);
		//we have to wait until all the dependencies are loaded to set this
		this.config.defaultModality = ReisRadar.model.Modality.PT;
	}
});

//class responsible for simple key value pair storing in HTML local storage
//and to have all persisted variables in one class
Ext.define('ReisRadar.util.LocalStorage',
{
	singleton: true,
	
	//save alias to local storage
	setAlias: function(alias)
	{
		localStorage.setItem('alias', alias);
	},

	//get alias from local storage
	getAlias: function()
	{
		return localStorage.getItem('alias');
	},

	setPassword: function(password)
	{
		localStorage.setItem('password', password);
	},

	getPassword: function()
	{
		return localStorage.getItem('password');
	},
	
	/*	
	//save the itineraries to local storage
	setItineraries: function()
	{
		localStorage.setItem('itineraties', itineraries);
	},
	
	//get itineraries from local storage
	getItineraries: function()
	{
		return localStorage.getItem('itineraries');
	}*/
});

/*local storage for created and imported itineraries */

Ext.define('ReisRadar.store.ItineraryStore', {
	extend: 'Ext.data.Store',
	config: {
		model: 'ReisRadar.model.Itinerary',
		proxy: 
		{
			type: 'localstorage',
			id: 'itineraries'
		},
		autoLoad: true
	}
});

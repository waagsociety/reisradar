/* this class represents an itinerary, which consists of an origin, a destination and a mode of transportation */

//FIELDS:
//id: unique identifier, created by local storage
//name: name of Itinerary, (original query for now)
//data: associative array, contains the following properties:

//name: same as name of itinerary
//point_origin: geo location of origin
//addr_origin: string representation of origin
//legs: collection of legs, each contains a start and end point

//if legs is empty, only radar mode is available for this itinerary
Ext.define('ReisRadar.model.Itinerary', {
	extend: 'Ext.data.Model',
	config: {
		idProperty: "localId",
		identifier: {
			type: 'uuid'
                },	
fields: ['localId','id', 'name', 'data']//all fields are serialized in the data object (associative array)
	}
});

Ext.define('ReisRadar.util.Util', {
	singleton: true,
	
	//display custom alert, with icon in button
	showAlert: function(title, message)
	{
		var msg = new Ext.MessageBox();
		msg.show({
			title: 'Notificatie',
			message: message,
			buttons: [{text: 'OK',itemId: 'ok', cls: 'titleButton', iconCls:'check'}],
			fn: function(response)
			{
				//nothingness
			}
		});
	},

	//GeoJSON string representation of a point struct (longitude, latitude)
	pointToGeoJSON: function(point)
	{
		return JSON.stringify(this.pointToGeometry(point));
	},

	//GeoJSon geometry object representation of a point struct
	pointToGeometry: function(point)
	{
		var geometry = new Object;
		geometry.type = 'Point';
		geometry.coordinates = [point.longitude,point.latitude];
		return geometry;
	},

	createMultiPoint: function(point1, point2)
	{
		var geometry = new Object;
		geometry.type = 'MultiPoint';
		geometry.coordinates = [[point1.longitude,point1.latitude],[point2.longitude,point2.latitude]];
		return geometry;
	},

	//calculate distance between two points
	calculateDistanceBetween: function(point_dest, point_orig)
	{
		var dest = new google.maps.LatLng(point_dest.latitude, point_dest.longitude);
		var orig = new google.maps.LatLng(point_orig.latitude, point_orig.longitude);
		var number = google.maps.geometry.spherical.computeDistanceBetween(orig, dest).toFixed(0);
		return number;
	},

	//calculate distance to origin
	calculateDistance: function(geom_dest)
	{
		//use google to compute geometrical distance
		if(geom_dest == undefined){return 0;}	
		var dest = new google.maps.LatLng(geom_dest.coordinates[1], geom_dest.coordinates[0]);

		//origin is the current location
		var geom_orig = ReisRadar.app.activeItinerary.point_origin;
		if(ReisRadar.app.activeLegPosition != undefined)
		{
			geom_orig = ReisRadar.app.activeLegPosition.coords;
		}

		var orig = new google.maps.LatLng(geom_orig.latitude, geom_orig.longitude);
		var number = google.maps.geometry.spherical.computeDistanceBetween(orig, dest).toFixed(0);

		//friendly display
		decPlaces = Math.pow(10, 2);
		var abbrev = ["k", "m", "b", "t"];
		for (var i = abbrev.length - 1; i >= 0; i--) {
			var size = Math.pow(10, (i + 1) * 3);
			if (size <= number) {
				var number = Math.round(number * decPlaces / size) / decPlaces;
				if((number == 1000) && (i < abbrev.length - 1)) {
					number = 1;
					i++;
				}
				number += abbrev[i];
				break;
			}
		}
		return number;
	},
	
	//calculate the perpendicular distance from a point to a line
	calculatePerpendicularDistance: function(point, line_start, line_end)
	{
		var p = new Object;
		p.x = point.latitude;
		p.y = point.longitude;

		var v = new Object;
		v.x = line_start.latitude;
		v.y = line_start.longitude;

		var w = new Object;
		w.x = line_end.latitude;
		w.y = line_end.longitude;

		//perp.js
		return distToSegment(p, v, w);
	}

});

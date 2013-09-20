var lmap,E_layer,dataE,lay;
var mov=[];
function init() {

if(typeof L == 'undefined') { setTimeout("init()",200); return; }
//window.L_DISABLE_3D = true;
//$('#map').css('height', $('#footer').position().top-$('#map').position().top);

var l2=getLayer(2), l1=getLayer(1), l0=getLayer(0);


 lmap = new L.Map('map', {
		crs:L.CRS.EPSG3857 
		,worldCopyJump:true
		,layers: [l2]
	});
	
	L.control.layers({"EMSC Map":l2,"Street Map":l1,"Aerial Map":l0}).addTo(lmap);

	resetMap();
	//layers(2);
	
	lmap.on("popupopen", function(evt){ currentPopup = evt.popup});
	lmap.on('dragend', function(event) { console.log('map drag end');
		var bounds=lmap.getBounds();
	//	var rect = L.rectangle(bounds, {color: 'blue', weight: 1}).addTo(lmap);

		for (var j0 in mov) { mov[j0].mark.setLatLng(mov[j0].origlatlng); }
		delete mov;
		var def=0;
		if(bounds._southWest.lng <= -180) def=-360;
		else if(bounds._northEast.lng >= 180) def=360;
		for (var j in dataE) {
			var z=bounds.contains([dataE[j].geometry.coordinates[1],dataE[j].geometry.coordinates[0]]);
			if(!z) {
				if(typeof dataE[j].marker != 'undefined') { 
					mov.push({mark:dataE[j].marker,origlatlng:dataE[j].marker.getLatLng()}); 
					dataE[j].marker.setLatLng(new L.LatLng(dataE[j].marker._latlng.lat,(dataE[j].marker._latlng.lng+def))); 
					//if(dataE[j].id==323326) console.log('['+dataE[j].marker._latlng.lat+','+(dataE[j].marker._latlng.lng+def)+']');
				} 
			}
		}
		
		//lmap.fitBounds(lmap.getBounds());
	});
	addlegend();
	L.marker([app._coords.lat, app._coords.lon]).addTo(lmap).bindPopup('Your GPS position');
	
}
function getLayer(n) {
	var tileUrl=[{url:'http://mtile0{s}.mqcdn.com/tiles/1.0.0/vy/sat/{z}/{x}/{y}.png',attr: 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a><img src="http://developer.mapquest.com/content/osm/mq_logo.png"/>',sub:[1,2,3,4],shema:'xyz'} /**/
				,{url:'http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.jpg', attr:'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a><img src="http://developer.mapquest.com/content/osm/mq_logo.png"/>',sub:[1,2,3,4],shema:'xyz'}
				,{url:'http://static{s}.emsc-csem.org/Images/TMS/{z}/{x}/{y}.png',attr: 'Map data © EMSC',sub:[1,2,3],shema:'xyz'}
				];
	//if(typeof E_layer!='undefined') lmap.removeLayer(E_layer);
	
	E_layer=new L.tileLayer( tileUrl[n].url, {
			maxZoom: 9, minZoom:1,
			attribution: tileUrl[n].attr,
			subdomains: tileUrl[n].sub,  //subdomains: [1,2,3,4],
			scheme: tileUrl[n].shema   //'xyz' //'tms'
			,continuousWorld: false
	});
	return E_layer;
}
function layers(n) { 
	//E_layer.addTo(lmap);
	getLayer(n).addTo(lmap);
}	
function resetMap() {
	if (typeof currentPopup !='undefined' &&  currentPopup != null) { currentPopup._close(); delete currentPopup; }
	loadData(); lmap.setView([0, 0], 2);
}

function markerById(id) {
	for(var i in dataE) { 
		if(dataE[i].id==id) return dataE[i].marker;
	}
}
function openPopup(id) {
	var m=markerById(id); m.openPopup();
}

function loadData() {
	if(typeof lmap == 'undefined') { setTimeout("loadData()",200); return; }
	dataE=app.getGeoJson(); 
	if(typeof lay !='undefined') { lmap.removeLayer(lay); lay.clearLayers(); }
	lay=L.geoJson(dataE, {
		pointToLayer: function (feature, latlng) {
			var marker=L.circleMarker(latlng, feature.geojsonMarkerOptions); 
			feature.marker=marker;
			return marker;
		},
		filter: function(feature, layer) {
				var mag=feature.properties.mag; 
				return true;
		},
		
		onEachFeature: function (feature, layer) {
			if (feature.properties && feature.properties.popupContent) {
				layer.bindPopup(feature.properties.popupContent); 
			}
		}
	
	}).addTo(lmap);
}
function getColor(d) {	return d > 300 ? 'purple' :  d > 150  ? 'blue' :  d > 80  ? 'lime' :  d > 40  ? 'yellow' : 'red'; }
function addlegend() {
	 var legend = L.control({position: 'bottomright'});
		legend.onAdd = function (map) {
			var div = L.DomUtil.create('div', 'info legend'), grades = [0, 40, 80, 150, 300],labels = [],from, to;
			for (var i = 0; i < grades.length; i++) {
				from = grades[i];
				to = grades[i + 1];
				labels.push('<li><span style="background:' + getColor(from + 1) + '">&nbsp;</span> ' +	from + (to ? '&ndash;' + to : '+')+'</li>');
			}
			div.innerHTML = 'Hypocentral Depth (Km)<ol>'+labels.join('')+'</ol>'+'Bullet size is relative to the magnitude';
			return div;
		};

		legend.addTo(lmap);
		$('#map .legend').css('margin-right',($(window).width()/2)- ($('#map .legend').width()/2));
}



try {
	if(typeof lmap == 'undefined') init(); 
	loadData();
}
catch(e) { console.log('error '+e.message); }

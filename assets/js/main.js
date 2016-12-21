var aNodes = [];
var aWays = [];
var aSegments = [];

var map = L.map('ctMap', {
    zoomControl: false
});
L.tileLayer('https://a.tiles.mapbox.com/v3/sztanko.gjp73mna/{z}/{x}/{y}.png', {
//    foo: 'bar',
    attribution: '&copy; <a target="_blank" href="http://osm.org/copyright">OpenStreetMap</a> contributors | <a target="_blank" href="http://www.openstreetmap.org/fixthemap">Improve this map</a>'
}).addTo(map);


map.setView([42.13, 24.75], 13);

// Add in a crosshair for the map
var crosshairIcon = L.icon({
    iconUrl: 'assets/images/cross.png',
    iconSize:     [20, 20], // size of the icon
    iconAnchor:   [10, 10], // point of the icon which will correspond to marker's location
});
crosshair = new L.marker(map.getCenter(), {icon: crosshairIcon, clickable:false});
crosshair.addTo(map);

// Move the crosshair to the center of the map when the user pans
map.on('move', function(e) {
    crosshair.setLatLng(map.getCenter());
});

//if (navigator.geolocation) { // not working?
//    navigator.geolocation.getCurrentPosition(function(position){
//        map.setView([position.coords.latitude, position.coords.longitude], 13);
//    });
//} 

map.on('moveend', function(){
    findStreets();
})

function findStreets(){
    var oPosition = map.getCenter();
    
    var sQuery = '[out:json][timeout:25];'+
                '('+
                  'way["highway"](around: 1000, '+oPosition.lat+', '+oPosition.lng+' ); '+
                ');'+
                '(._;>;);'+
                'out body;'
    $.ajax({
        url: 'https://overpass-api.de/api/interpreter?data='+sQuery,
        dataType: 'json',
        crossDomain: true,
        success: function(res){
            console.log('res', res, res.elements.length)
            aNodes = [];
            aWays = [];
            
            for (var i in res.elements){
                var item = res.elements[i];
                if (item.type == 'node'){
                    aNodes[item.id] = item;
                }
                if (item.type == 'way'){
                    aWays[item.id] = item;
                }
            }

            parseSegments();
        }
    })
}

function parseSegments(){
    aSegments = [];
    for (var i in aWays){
        var oSegment = {};
        for (var j = 1; j < aWays[i].nodes.length; j++){
            var idxFrom = aWays[i].nodes[j-1];
            var idxTo = aWays[i].nodes[j];
            oSegment.from_idx = idxFrom;
            oSegment.to_idx = idxTo;
            oSegment.from = aNodes[idxFrom];
            oSegment.to = aNodes[idxTo];
            oSegment.bearing = bearing(oSegment.from.lat, oSegment.from.lon, oSegment.to.lat, oSegment.to.lon);
            aSegments.push(oSegment)
        }
    }
    
    markBearing(); // @TODO: not here
}

function markBearing(){
    var iTargetBearing = 45;
    var iAllowedDelta = 5;
    for (var i in aSegments){
        var iThisBearing = aSegments[i].bearing;
        
        if (Math.abs(iThisBearing - iTargetBearing) < iAllowedDelta){
            makeFeature(aSegments[i], 'red');
        }
        
        // check for reverse direction
        iTargetBearing = (iTargetBearing + 180) % 360;
        if (Math.abs(iThisBearing - iTargetBearing) < iAllowedDelta){
            makeFeature(aSegments[i], 'red');
        }
    }
}

function makeFeature(oSegment, color){
    var latlngs = [
        [oSegment.from.lat, oSegment.from.lon],
        [oSegment.to.lat, oSegment.to.lon]
    ]
    var polyline = L.polyline(latlngs, {color: color}).addTo(map);
}

$(document).ready(function(){
    findStreets();
})

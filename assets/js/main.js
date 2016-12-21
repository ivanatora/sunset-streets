var aNodes = [];
var aWays = [];
var aSegments = [];
var sunriseAngle = 0;
var sunsetAngle = 0;

var map = L.map('ctMap', {
    zoomControl: false
});
L.tileLayer('https://a.tiles.mapbox.com/v3/sztanko.gjp73mna/{z}/{x}/{y}.png', {
//    foo: 'bar',
    attribution: '&copy; <a target="_blank" href="http://osm.org/copyright">OpenStreetMap</a> contributors | <a target="_blank" href="http://www.openstreetmap.org/fixthemap">Improve this map</a>'
}).addTo(map);


map.setView([42.13, 24.75], 13);
//map.setView([42.67369, 23.28940], 13);

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
    findStreets_buffered();
})

var timeout = null;
function findStreets_buffered(){
    clearTimeout(timeout);
    timeout = setTimeout(function(){
        findStreets();
    }, 1000);
}

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
        for (var j = 1; j < aWays[i].nodes.length; j++){
            var oSegment = {};
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
    
    recalculateSunBearing();
}

function clearLayers(){
    for(i in map._layers) {
        if(map._layers[i]._path != undefined) {
            try {
                map.removeLayer(map._layers[i]);
            }
            catch(e) {
//                console.log("problem with " + e + map._layers[i]);
            }
        }
    }
}

function markBearing(iTargetBearing, color){
//    var iTargetBearing = 0;
    var iAllowedDelta = 5;
    for (var i in aSegments){
        var iThisBearing = aSegments[i].bearing;
        
        var fits = Math.abs(iThisBearing - iTargetBearing);
        if (fits < iAllowedDelta){
            makeFeature(aSegments[i], color);
        }
        
        // check for reverse direction
        var iReverseTargetBearing = (iTargetBearing + 180) % 360;
        fits = Math.abs(iThisBearing - iReverseTargetBearing);
        if (fits < iAllowedDelta){
            makeFeature(aSegments[i], color);
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

function recalculateSunBearing(){
    var oPosition = map.getCenter();
    
    var year = $('#formDate input[name="year"]').val();
    var month = $('#formDate input[name="month"]').val() - 1;
    var day = $('#formDate input[name="day"]').val();
    
    var date = new Date(year, month, day);
    var dayInfo = SunCalc.getDayInfo(date, oPosition.lat, oPosition.lng);
    $('#sunrise span').html(dayInfo.sunrise.start);
    $('#sunset span').html(dayInfo.sunset.start);
    
    var sunrisePosition = SunCalc.getSunPosition(dayInfo.sunrise.start, oPosition.lat, oPosition.lng);
    sunriseAngle = _toDeg(sunrisePosition.azimuth - Math.PI);
    sunriseAngle = (sunriseAngle + 360) % 360;
    var sunsetPosition = SunCalc.getSunPosition(dayInfo.sunset.start, oPosition.lat, oPosition.lng);
    sunsetAngle = _toDeg(sunsetPosition.azimuth - Math.PI);
    sunsetAngle = (sunsetAngle + 360) % 360;
    $('#sunrise_bearing').html(sunriseAngle);
    $('#sunset_bearing').html(sunsetAngle);
    
    clearLayers();
    markBearing(sunriseAngle, 'blue');
    markBearing(sunsetAngle, 'red');
}

$(document).ready(function(){
    findStreets();
    
    $('#formDate button').click(function(e){
        e.preventDefault();
        
        recalculateSunBearing();
    })
})

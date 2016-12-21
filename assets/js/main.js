var aNodes = [];
var aWays = [];

var oTileJson = {
    tiles: [
        'http://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'http://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'http://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
    ],
    minzoom: 0,
    maxzoom: 18,
    zoomControl: false
};
var oTileJson = 'mapbox.streets';
var map = L.map('ctMap', {
    zoomControl: false
});
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png?{foo}', {
    foo: 'bar',
    attribution: '&copy; <a target="_blank" href="http://osm.org/copyright">OpenStreetMap</a> contributors | <a target="_blank" href="http://www.openstreetmap.org/fixthemap">Improve this map</a>'
}).addTo(map);

map.setView([43, 24], 13);
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
        url: 'http://www.overpass-api.de/api/interpreter?data='+sQuery,
        dataType: 'json',
        crossDomain: true,
        success: function(res){
            aNodes = [];
            aWays = [];
            
            for (var i in res){
                var item = res[i];
                if (item.type == 'node'){
                    aNodes[item.id] = item;
                }
                if (item.type == 'way'){
                    aWays[item.id] = item;
                }
            }
        }
    })
}

$(document).ready(function(){
    
})

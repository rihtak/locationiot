/**
 * @fileoverview This demo is used for MarkerClusterer. It will show 100 markers
 * using MarkerClusterer and count the time to show the difference between using
 * MarkerClusterer and without MarkerClusterer.
 * @author Luke Mahe (v2 author: Xiaoxi Wu)
 */

function el(element) {
    return document.getElementById(element);
}


var machineNRT = {};
var OVER_HEAT_TEMPERATURE = 85;
var ENGINE_ON = 1,ENGINE_ON_STRING="Running";
var ENGINE_OFF = 0,ENGINE_OFF_STRING = "Idle";
machineNRT.data = null;
machineNRT.map = null;
machineNRT.markerClusterer = null;
machineNRT.runningClusterer = null;
machineNRT.idleClusterer = null;
machineNRT.markers = [];
machineNRT.runningMarkers = [];
machineNRT.idleMarkers = [];
machineNRT.overHeatMarkers =[];
machineNRT.overHeatClusterer = null;
machineNRT.infoWindow = null;
machineNRT.range = 1000;
machineNRT.init = function() {

    var latlng = new google.maps.LatLng(36.090240, -95.712891);
    var options = {
        'zoom': 4,
        'center': latlng,
        'mapTypeId': google.maps.MapTypeId.ROADMAP
    };

    machineNRT.map = new google.maps.Map(el('map'), options);
    //var url = "http://10.4.4.132:9080/MachineData/*";
    var url = "data/hbaseData.json";
    d3.json(url,function(error,data){
        if(error)
            console.log("data",error)

            console.log("encoded data",data);
        var output= parseHBaseRest(data,"MachineID");
        console.log("decodeData",output);

    })
    d3.json("data/output.json", function(error, machineData) {
        if(error)
            console.log(error);
        //console.log("machine",machineData);
        machineNRT.data = machineData;        
        var useGmm = document.getElementById('usegmm');
        google.maps.event.addDomListener(useGmm, 'click', machineNRT.change);
        var useGmm = document.getElementById('usegmm');
        google.maps.event.addDomListener(useGmm, 'click', machineNRT.change);

        var machineStatus = document.getElementById('machineStatus');
        google.maps.event.addDomListener(machineStatus, 'change', machineNRT.change);
        var machineRange = document.getElementById('machineRange')
        google.maps.event.addDomListener(machineRange, 'change', machineNRT.change);

        machineNRT.infoWindow = new google.maps.InfoWindow();

        machineNRT.showMarkers();
    });




};

machineNRT.showMarkers = function() {
    machineNRT.markers = [];
    machineNRT.runningMarkers = [];
    machineNRT.idleMarkers = [];
    machineNRT.overHeatMarkers =[];
    var machineStatus= document.getElementById('machineStatus').value;
    var machineRange = document.getElementById('machineRange').value;
    var filteredData = null;
    if(machineStatus!="" && machineRange == "")
    {
        filteredData = _.filter(machineNRT.data, function(obj) {

            return obj.EngineOn == machineStatus ;
        });
    }
    else if(machineStatus!="" && machineRange != ""){
        filteredData  = _.filter(machineNRT.data, function(obj) {
            var res = false;
            if((obj.EngineOn == machineStatus)  && ( obj.MachineId <= machineRange  &&  obj.MachineId > machineRange-machineNRT.range))
                res = true
                return res ;
        });
    }
    else if(machineStatus =="" && machineRange != ""){
        filteredData  = _.filter(machineNRT.data, function(obj) {
            var res = false;
            if(( obj.MachineId <= machineRange  &&  obj.MachineId > machineRange-machineNRT.range))
                res = true
                return res ;
        });
    }


    else{
        filteredData = machineNRT.data;
    }

    console.log("Status",filteredData.length);
    var type = 1;
    if (el('usegmm').checked) {
        type = 0;
    }

    if (machineNRT.markerClusterer) {
        machineNRT.markerClusterer.clearMarkers();
    }
    if(machineNRT.runningClusterer)
    {
        machineNRT.runningClusterer.clearMarkers();
    }
    if(machineNRT.idleClusterer)
    {
        machineNRT.idleClusterer.clearMarkers();
    }
    if(machineNRT.overHeatClusterer){
        machineNRT.overHeatClusterer.clearMarkers();
    }
    var panel = el('markerlist');
    panel.innerHTML = '';


    for (var i = 0; i < filteredData.length; i++) {
        var titleText = filteredData[i].MachineId;
        if (titleText === '') {
            titleText = 'No title';
        }

        var item = document.createElement('DIV');
        var title = document.createElement('A');
        title.href = '#';
        title.className = 'title';
        title.innerHTML = titleText;

        item.appendChild(title);
        panel.appendChild(item);
        // console.log("lat",machineNRT.data[i].Latitude);
        //  console.log("long",machineNRT.data[i].Longitude);

        var latLng = new google.maps.LatLng(filteredData[i].Latitude,
                                            filteredData[i].Longitude);


        var runningImage = "images/markers/running.png"
        var idleImage = "images/markers/idle.png"
        var markerImage = "";

        if(filteredData[i].EngineOn == 1){
            markerImage = runningImage;
        }
        else{
            markerImage = idleImage;
        }

        var markerImage = new google.maps.MarkerImage(markerImage,
                                                      new google.maps.Size(28, 34));


        var marker = new google.maps.Marker({
            'position': latLng,
            'icon': markerImage
        });


        var fn = machineNRT.markerClickFunction(filteredData[i], latLng);
        google.maps.event.addListener(marker, 'click', fn);
        /*  google.maps.event.addDomListener(title, 'click', fn);*/

        if(filteredData[i].Temperature > OVER_HEAT_TEMPERATURE)
        {
            marker.setAnimation(google.maps.Animation.BOUNCE);
            machineNRT.overHeatMarkers.push(marker);

        }
        else{
            if(filteredData[i].EngineOn == 1){

                machineNRT.runningMarkers.push(marker);
            }
            else{
                machineNRT.idleMarkers.push(marker);
            }
        }
        //machineNRT.markers.push(marker);
    }

    window.setTimeout(machineNRT.time, 0);
};
function getEngineStatus(status){
    if(status == ENGINE_ON){
        return ENGINE_ON_STRING;
    }
    else{
        return ENGINE_OFF_STRING;
    }
}
machineNRT.markerClickFunction = function(machine, latlng) {
    return function(e) {
        e.cancelBubble = true;
        e.returnValue = false;
        if (e.stopPropagation) {
            e.stopPropagation();
            e.preventDefault();
        }
        var machineID = machine.MachineId;
        var temperature = machine.Temperature;        
        var engineNoise = machine.EngineNoise;
        var battery = machine.Battery;
        var engineStatus = getEngineStatus(machine.EngineOn);

        var infoHtml = '<div class="info"><h3>Machine ID : '+machineID+
            '</h3><div class="info-body1"> <h4>Status : '+engineStatus+'</h4><h4>Temperature :'+temperature+'</h4><h4>Engine Noise :'+engineNoise+'</h4><h4>Battery :'+battery+'</h4></div></div>';

        machineNRT.infoWindow.setContent(infoHtml);
        machineNRT.infoWindow.setPosition(latlng);
        machineNRT.infoWindow.open(machineNRT.map);
    };
};

machineNRT.clear = function() {
    el('timetaken').innerHTML = 'cleaning...';
    for (var i = 0, marker; marker = machineNRT.markers[i]; i++) {
        marker.setMap(null);
    }
    for (var i = 0, marker; marker = machineNRT.idleMarkers[i]; i++) {
        marker.setMap(null);
    }
    for (var i = 0, marker; marker = machineNRT.runningMarkers[i]; i++) {
        marker.setMap(null);
    }
};

machineNRT.change = function() {
    machineNRT.clear();
    machineNRT.showMarkers();
};

machineNRT.time = function() {
    el('timetaken').innerHTML = 'timing...';
    var start = new Date();
    if (el('usegmm').checked) {

        machineNRT.idleClusterer = new MarkerClusterer(machineNRT.map, machineNRT.idleMarkers, {imagePath: '../images/markers/idle'});
        machineNRT.runningClusterer = new MarkerClusterer(machineNRT.map, machineNRT.runningMarkers, {imagePath: '../images/markers/running'});
        machineNRT.overHeatClusterer = new MarkerClusterer(machineNRT.map,machineNRT.overHeatMarkers, {imagePath: '../images/markers/heat'});
    } else {
        for (var i = 0, marker; marker = machineNRT.markers[i]; i++) {
            marker.setMap(machineNRT.map);
        }
        for (var i = 0, marker; marker = machineNRT.idleMarkers[i]; i++) {
            marker.setMap(machineNRT.map);
        }
        for (var i = 0, marker; marker = machineNRT.runningMarkers[i]; i++) {
            marker.setMap(machineNRT.map);
        }

    }

    var end = new Date();
    el('timetaken').innerHTML = end - start;
};

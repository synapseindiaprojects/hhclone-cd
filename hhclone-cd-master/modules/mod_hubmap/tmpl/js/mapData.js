(function($) {

    var map = {};
    var loc = [];
    var links = []; //STORES THE CREATED LINKS USED FOR THE INFOWINDOWS
    var markersPinned = [];//STORES THE MARKERS THAT ARE DISPLAYED IN THE MAP
    var hubsAvailable = [];//STORES ALL THE HUBS AVAILABLE W/ NAME, STATE, LATITUDE, LONGITUDE
    var markers = [];//STORES MARKERS CREATED WHEN SEARCHING,BUT CONTENT IS DELETED WHEN NEW SEARCH
    var infoWindowOfMarkers = [];//STORES THE INFOWINDOWS OF EACH MARKER
    var hubsOpen = [];//STORES THE HUB MARKERS THAT INFOWINDOWS ARE OPENED
    var townsOfHubs = [];//STORES THE TOWNS FROM EACH HUB, USED TO CHECK IF THERE ARE MORE HUBS IN ONE TOWN
    var stateOfHubs=[];
    var newURL = window.location.host.replace('www.', '');//GETS THE URL 
    var apiNotLoaded = typeof google === 'undefined';//DETERMINES WHETHER THE GOOGLE API HAS LOADED
    var availableTags=[];
    //IF IT GOOGLE API IS LOADED
    if (!apiNotLoaded) {
        var defaultLocation = new google.maps.LatLng(41.284063, -73.497541);//SETS DEFAULT LOCATION TO RIDGEFIELD,CT
    }

    //STORES HUBS AT FURTHEST EXTREMES
    var furthestTop; 
    var furthestTopIndex=0;
    var furthestBottom;
    var furthestBottomIndex=0;
    var furthestLeft;
    var furthestLeftIndex=0;
    var furthestRight;
    var furthestRightIndex=0;

    //CLUSTER & STYLES
    /*
    var markerCluster;
    var mcOptions = {
        gridSize:100,
        maxZoom:11,
        
        styles: [{
            height: 53,
            url: "/modules/mod_hubmap/tmpl/images/clusterTest2.png",
            width: 53,
            textColor: '#71ADA2',
            textSize: 1
        },
        {
            height: 56,
            url: "/modules/mod_hubmap/tmpl/images/clusterTest2.png",
            width: 56,
            textColor: '#71ADA2',
            textSize: 1
        }
    ]};
    */
        
   
    function setMarkers(hubLocations, hubLinks, callback) {
        var bounds = new google.maps.LatLngBounds();
        var infoWindow = new google.maps.InfoWindow({maxWidth: 520}), marker, i;
        var image = 'modules/mod_hubmap/tmpl/images/markerHH.png';

        // Loop through our array of markers & place each one on the map  
        for (i = 0; i < hubLocations.length; i++) {
            var position = new google.maps.LatLng(hubLocations[i][1], hubLocations[i][2]);
            bounds.extend(position);
            marker = new google.maps.Marker({
                position: position,
                map: map,
                title: hubLocations[i][0],
                animation: google.maps.Animation.DROP,
                icon: image
            });
            google.maps.event.addListener(marker, 'click', (function(marker, i) {
                return function() {
                    infoWindow.setContent(hubLinks[i]);
                    infoWindow.open(map, marker);
                }
            })(marker, i));
            markersPinned.push(marker);
            infoWindowOfMarkers.push(infoWindow);
        }

        callback();
    }

    function getHubs() {
        $.ajax({
            url: 'index.php?option=com_api&view=hamlethub',
            type: 'GET',
            success: function(response) {
                var hubs = $.parseJSON(response);
                var z = 0;//INDEX FOR LINKS
                for (var k = 0; k < hubs.data.length; k++)
                {
                    
                    /*GET ALL INFORMATION OF EACH HUB*/
                    var state = hubs.data[k]['hub_state_code'];
                    var townLat = hubs.data[k]['latitude'];
                    var townLong = hubs.data[k]['longitude'];
                    var hubName = hubs.data[k]['hub_name'];
                    var domain = hubs.data[k]['domain'];
                    var townName = hubs.data[k]['town_name'];

                    townName=townName.replace(/\s/g, '');//REMOVE SPACES FROM TOWN
                    var townExists = false;
                    var indexOfExistingTown = $.inArray("" + townName, townsOfHubs);

                    //IF TOWN DOES NOT HAVE A HUB
                    if (indexOfExistingTown == -1) {
                        var townLink = '<a href="http://' + domain + '">' + hubName + '\'s HamletHub</a>';
                        stateOfHubs.push(state);
                        townsOfHubs.push(townName); //ADD TOWN OF HUB
                        links[z] = townLink;//ADD LINK OF HUB
                        loc.push([townName, townLat, townLong]);//ADD TOWN WITH COORDINATES FOR MARKER CREATION
                        hubsAvailable.push([hubName, state, townLat, townLong,townName]);//ADD HUB FOR COMPARISON
                        populateSideBar(hubName, domain);//ADD HUB TO SIDEBBAR
                        availableTags.push(hubName);
                    }

                    //IF TOWN HAS AT LEAST ONE HUB
                    else {
                        hubsAvailable.push([hubName, state, townLat, townLong]);//ADD HUB FOR COMPARISON
                        links[indexOfExistingTown] = links[indexOfExistingTown] + '</br><a href="http://' + domain + '">' + hubName + '\'s HamletHub</a>';
                        populateSideBar(hubName, domain);
                        availableTags.push(hubName);
                        z--;
                    }
                    z++;
                }

                /*THIS IS USED BECAUSE OF THE "GOOGLE" LOGO COVERS THE LAST HUB IN THE SIDEBAR*/
                var emptySpace = '<li><a id="empty" class="disabled"></a></li>';
                $("#hubMenu").append(emptySpace);

                furthestTop=loc[0][1]; 
                furthestBottom=loc[0][1];
                furthestLeft=loc[0][2];
                furthestRight=loc[0][2];

                //IF THE GOOGLE API HAS LOADED
                if (apiNotLoaded == false) {
                    //PLACE MARKERS W/ INFOWINDONWS ON MAP. ONCE COMPLETED, LOCATE USER LOCATION
                    setMarkers(loc, links, function() {
                        //markerCluster = new MarkerClusterer(map, markersPinned,mcOptions);
                        map.setCenter(defaultLocation);
                        map.setZoom(10);
                        //fourFurthest();
                    });
                }
            },
            fail: function(err) {
                console.log(err);
            }
        });
    }
   
    function locateGEOPosition(ipPos) {
        var latitude;
        var longitude;
        if (navigator.geolocation) {
            browserSupportFlag = true;
            navigator.geolocation.getCurrentPosition(function(position) {
                var pos = new google.maps.LatLng(position.coords.latitude,
                        position.coords.longitude);
                map.setCenter(pos);
                map.setZoom(12);
            }, function() {
                handleNoGeolocation(browserSupportFlag, ipPos);
            });
        }
        else {
            // Browser doesn't support Geolocation
            browserSupportFlag = false;
            handleNoGeolocation(browserSupportFlag, ipPos);
        }
    }

    function handleNoGeolocation(errorFlag, ipPos) {

        //GEOLOACATION SERVICE FAILED, PLACE IN IP COORDINATES
        if (errorFlag == true)
        {
            map.setCenter(defaultLocation);
            map.setZoom(10);
            //zoomFurthestFour(furthestTopIndex,furthestBottomIndex,furthestRightIndex,furthestLeftIndex);
        }
        //BROWSER DOES NOT SUPPORT GEOLOCATION, PLACE IN DEFAULT(RIDGEFIELD)
        else {
             map.setCenter(defaultLocation);
             map.setZoom(10);
            //zoomFurthestFour(furthestTopIndex,furthestBottomIndex,furthestRightIndex,furthestLeftIndex);
        }
    }


    //POPULATES THE SIDEBAR WITH HUBS
    function populateSideBar(hubName, domain) {
        var htmlString = '<li><a href="http://' + domain + '">' + hubName + '</a></li>';
        $("#hubMenu").append(htmlString);
    }

    function zoomToSeeHub() {
        var isDisplayedBegin = false;
        var isDisplayedEnd = false;
        var isDisplayed = false;
        var zoom = 13;
        var indexMarkerFound;
        var endIndex = markersPinned.length - 1;
        while (isDisplayed != true) {
            zoom--;
            map.setZoom(zoom);
            for (var k = 0; k < markersPinned.length; k++) {
                isDisplayedBegin = map.getBounds().contains(markersPinned[k].getPosition());
                isDisplayedEnd = map.getBounds().contains(markersPinned[endIndex].getPosition());
                if (isDisplayedBegin == true) {
                    isDisplayed = true;
                    indexMarkerFound = k;
                    break;
                }
                else if (isDisplayedEnd == true) {
                    isDisplayed = true;
                    indexMarkerFound = endIndex;
                    break;
                }
            }
        }
    }

    function fourFurthest(){
        for(var k=1;k<loc.length;k++){
            if(loc[k][1]>furthestTop){
                furthestTop=loc[k][1];
                furthestTopIndex=k;
            }
            if(loc[k][1]<furthestBottom){
                furthestBottom=loc[k][1];
                furthestBottomIndex=k;
            }
            if(loc[k][2]>furthestLeft){
                furthestLeft=loc[k][2];
                furthestLeftIndex=k;
            }
            if(loc[k][2]<furthestRight){
                furthestRight=loc[k][2];
                furthestRightIndex=k;
            }
        }
       
        zoomFurthestFour(furthestTopIndex,furthestBottomIndex,furthestRightIndex,furthestLeftIndex);
        
    }

    function zoomFurthestFour(furthestTopIndex,furthestBottomIndex,furthestRightIndex,furthestLeftIndex){
        var areDisplayed = false;
        var topDisplayed=false;
        var bottomDisplayed=false;
        var rightDisplayed=false;
        var leftDisplayed=false;
        var zoom = 13;
        var indexMarkerFound;
        while (areDisplayed != true) {
            zoom--;
            map.setZoom(zoom);
                topDisplayed=map.getBounds().contains(markersPinned[furthestTopIndex].getPosition());
                bottomDisplayed=map.getBounds().contains(markersPinned[furthestBottomIndex].getPosition());
                rightDisplayed=map.getBounds().contains(markersPinned[furthestRightIndex].getPosition());
                leftDisplayed=map.getBounds().contains(markersPinned[furthestLeftIndex].getPosition());
                if (topDisplayed == true && bottomDisplayed==true && rightDisplayed==true && leftDisplayed==true) {
                    areDisplayed==true;
                    //console.log(zoom);
                    break;
                }
        }
    }


    function checkExistAndMatch(town, town2, name, name2, stateID) {
        var matchInputExist = new Object();
        var exists = false;
        var match = false;
        var endIndex = hubsAvailable.length - 1;
        matchInputExist.addressIsHub = false;
            
        //IF THE INPUT WAS NOT AN ADDRESS
        if(name=="noAddress")
        {
             indexIfTownFound=$.inArray(town,townsOfHubs);
            
            //IF INPUT IS A HUB
            if (indexIfTownFound!=-1&&stateOfHubs[indexIfTownFound]==stateID) {
                exists = true;
                matchInputExist.indexFound=indexIfTownFound; 
                match=true; 
            }
        }   
        
        //IF THE INPUT WAS AN ADDRESS
        else{

            //IF ADDRESS IS PART OF AN TOWN WITH A HUB
            indexIfTownFound=$.inArray(town2,townsOfHubs);

            //CHECK IF ADDRESS IS A HUB
             for (var k = 0; k < hubsAvailable.length; k++)
            {
                var t1 = hubsAvailable[k][0];
                t1 = t1.replace(/\s/g, '');

                var t2 = hubsAvailable[endIndex][0];
                t2 = t2.replace(/\s/g, '');

                //IF ADDRESS IS A HUB
                if((town==t1||town==t2) && indexIfTownFound!=-1 && stateOfHubs[indexIfTownFound]==stateID)
                {
                    exists=true;
                    matchInputExist.addressIsHub=true;
                    matchInputExist.indexFound=indexIfTownFound;
                    break;
            }

            //IF ADDRESS IS NOT A HUB, BUT IT IS IN A TOWN WITH A HUB
            else if(indexIfTownFound!=-1 && stateOfHubs[indexIfTownFound]==stateID){
                exists=true;
                matchInputExist.indexFound=indexIfTownFound;
                matchInputExist.addressIsHub==false;
            }
            endIndex--;
        }

    }

        matchInputExist.match = match;
        matchInputExist.exists = exists;

        return matchInputExist;
    }

    $(function() {
        //IF GOOGLE API DOES NOT WORK
        if (apiNotLoaded) {
            getHubs();
            $("#map_canvas").css("position", "absolute");
            $("#map_canvas").css("width", "150px");
            $("#sideBarMenu").css("height", "300px");
            $("#books-calendar").css("margin-top", "85px");
            $("#pac-input").css("display", "none");
            $("#sideBarButton").css("display", "none");
            $("#hubMenu").css("left", "0");
        }
        else {
            var mapOptions = {
                zoom: 12,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                mapTypeControl: false,
                streetViewControl: false,
                panControl: true,
                panControlOptions: {
                    position: google.maps.ControlPosition.TOP_RIGHT
                },
                zoomControl: true,
                zoomControlOptions: {
                    position: google.maps.ControlPosition.TOP_RIGHT
                },
                styles: [
                    {
                        "featureType": "water",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#a2daf2"
                            }
                        ]
                    },
                    {
                        "featureType": "landscape.man_made",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#f7f1df"
                            }
                        ]
                    },
                    {
                        "featureType": "landscape.natural",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#d0e3b4"
                            }
                        ]
                    },
                    {
                        "featureType": "landscape.natural.terrain",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "visibility": "off"
                            }
                        ]
                    },
                    {
                        "featureType": "poi.park",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#bde6ab"
                            }
                        ]
                    },
                    {
                        "featureType": "poi",
                        "elementType": "labels",
                        "stylers": [
                            {
                                "visibility": "off"
                            }
                        ]
                    },
                    {
                        "featureType": "poi.medical",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#fbd3da"
                            }
                        ]
                    },
                    {
                        "featureType": "poi.business",
                        "stylers": [
                            {
                                "visibility": "off"
                            }
                        ]
                    },
                    {
                        "featureType": "road",
                        "elementType": "geometry.stroke",
                        "stylers": [
                            {
                                "visibility": "off"
                            }
                        ]
                    },
                    {
                        "featureType": "road",
                        "elementType": "labels",
                        "stylers": [
                            {
                                "visibility": "off"
                            }
                        ]
                    },
                    {
                        "featureType": "road.highway",
                        "elementType": "geometry.fill",
                        "stylers": [
                            {
                                "visibility": "off"
                            }
                        ]
                    },
                    {
                        "featureType": "road.highway",
                        "elementType": "geometry.stroke",
                        "stylers": [
                            {
                                "color": "#efd151"
                            }
                        ]
                    },
                    {
                        "featureType": "road.arterial",
                        "elementType": "geometry.fill",
                        "stylers": [
                            {
                                "color": "#ffffff"
                            }
                        ]
                    },
                    {
                        "featureType": "road.local",
                        "elementType": "geometry.fill",
                        "stylers": [
                            {
                                "color": "black"
                            }
                        ]
                    },
                    {
                        "featureType": "transit.station.airport",
                        "elementType": "geometry.fill",
                        "stylers": [
                            {
                                "color": "#cfb2db"
                            }
                        ]
                    },
                    {
                        "featureType": "administrative.neighborhood",
                        "elementType": "labels",
                        "stylers": [
                            {
                                "visibility": "off" 
                            }
                        ]
                    }
                ]
            };

            //DISPLAY MAP
            map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);

            //INSERT SIDEBAR IN MAP
            var leftSideBar = (document.getElementById('sideBarMenu'));
            map.controls[google.maps.ControlPosition.TOP_LEFT].push(leftSideBar);

            //INSERT SEARCH BAR IN MAP
            var input = (document.getElementById('pac-input'));
            map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
            var searchBox = new google.maps.places.SearchBox((input));

            var myLocation=(document.getElementById('mLocation'));
            map.controls[google.maps.ControlPosition.TOP_LEFT].push(myLocation);

            //GETS HUBS FROM API AND POPULATES THE MAP & SIDEBAR
            //AFTER MARKERS ARE CREATED, USER LOCATION IS THEN DETERMINED
            getHubs();
            /*
            $('#pac-input').autocomplete({
            source: availableTags,
            select:function(event, ui){
                var lat;
                var longi;
                
                //Search for coordinates of Selection
                var foundIndex;
                var endIndex=loc.length-1;
                for(var i=0;i<loc.length;i++)
                {
                    if(ui.item.value==loc[i][0])
                    {
                        lat=loc[i][1];
                        longi=loc[i][2];
                        foundIndex=i;
                        break;
                    }
                    else if(ui.item.value==loc[endIndex][0])
                    {
                        lat=loc[endIndex][1];
                        longi=loc[endIndex][2];
                        foundIndex=endIndex;
                        break;
                    }
                }
                var selectedPosition=new google.maps.LatLng(lat, longi);
                map.panTo(selectedPosition);

                google.maps.event.trigger( markersPinned[foundIndex], 'click' );
                
            }

        });
        */  

            /********************SIDEBAR MENU************************************************/

            $("#sideBarButton").click(function() {

                var position = $("#sideBarButton").position();
                if (position.left == 250) {
                    $("#hubMenu").animate({left: -250}, 1000, 'easeInOutExpo');
                    $(this).animate({left: 0}, 1000, 'easeInOutExpo');
                    $(this).removeClass("icon-chevron-left");
                    $(this).addClass("icon-chevron-right");
                    return false;
                }
                else if (position.left == 0) {
                    $("#hubMenu").animate({left: 0}, 1000, 'easeInOutExpo');
                    $(this).animate({left: 250}, 1000, 'easeInOutExpo');
                    $(this).removeClass("icon-chevron-right");
                    $(this).addClass("icon-chevron-left");
                    return false;
                }
            });


            $("#mLocation").click(function(){
                locateGEOPosition();
            })


            /******************** START SEARCH BAR EVENT*********************************/

            google.maps.event.addListener(searchBox, 'places_changed', function() {
                var places = searchBox.getPlaces();

                if (places.length == 0) {
                    alert("You have entered an invalid address");
                    zoomToSeeHub();
                }
                else {

                    /**Close Opened Markers and Remove New Markers Created******/
                    if (hubsOpen[0] != null)
                        infoWindowOfMarkers[hubsOpen[0]].close();


                    for (var i = 0, marker; marker = markers[i]; i++) {
                        marker.setMap(null);
                    }

                    markers = [];
                    hubsOpen = [];

                    // For each place, get the icon, place name, and location.
                    var bounds = new google.maps.LatLngBounds();
                    //Get first place
                    var place = places[0];
        //console.log(place);

                    // Gets coordinates of place
                    var pos = place.geometry.location;
                    //Prepares CheckInputMatches Comparison
                    var placeFormat = place.formatted_address;
                    placeFormat = placeFormat.replace(/ /g, '');

                    //Is it an Address?
                    var isAddress = false;
                    if ($.inArray("street_address", place.types) != -1 || $.inArray("route", place.types) != -1
                            || $.inArray("neighborhood", place.types) != -1 || $.inArray("establishment", place.types) != -1
                            || $.inArray("sublocality", place.types) != -1) {
                        isAddress = true;
                    }

                    //Format of Place in Array
                    var locationData = placeFormat.split(',');


                    //Does a Hub already exist in that area?
                    var existCheck = false;

                    //Stores whether it exists,and if it does, it will have the index of where the hub is
                    var matchExistsObject = {};
                    //Index of where the matching hub was found
                    var indexWhereFound;
  
                    /* SINCE THE RETURNED FORMAL ADDRESS MAY VARY DEPENDING ON INPUT, THERE ARE DIFFERENT SCENARIONS OF WHAT TO CHECK FOR EXISTING/EXACT MATCH*/
                    if (isAddress == false) {
                        var stateID = locationData[1].substring(0, 2);
                        if($.inArray("colloquial_area",place.types)!=-1){
                                var end;
                                var index;
                                for(var k=0;k<hubsAvailable.length;k++){
                                    index=$.inArray(locationData[0]+"",hubsAvailable[k])
                                    if(index!=-1)
                                    {
                                        locationData[0]=hubsAvailable[k][4];
                                        break;
                                    }
                                }
                        }
                        matchExistsObject = checkExistAndMatch(locationData[0], "", "noAddress", "", stateID);
                        /*Example of locationData["Danbury","CT","USA"]*/
                    }
                    else {
                        var stateID = locationData[2].substring(0, 2);

                        matchExistsObject = checkExistAndMatch(locationData[0], locationData[1], "", "", stateID);
                        /*Example of locationData["CosCob","Greenwhich","CT06810","USA"]
                        matchExistsObject={addressIsHub: true, indexFound: 4, found: true, exists: true} 
                        */
                    }

                    existCheck = matchExistsObject.exists;
  
                    //If there was no exact match or if the input was an address
                    if (matchExistsObject.match == false || (isAddress && matchExistsObject.addressIsHub == false)) {
                        //Create input location marker
                        var marker = new google.maps.Marker({
                            map: map,
                            icon: place.image,
                            title: place.name,
                            position: pos
                        });
                        //if no hubs are in that area
                        if (existCheck == false) {
                            var infowindow = new google.maps.InfoWindow({
                                content: '<a id="newHub" href="http://www.' + newURL + '/ilovemytown"</a>Interested in starting a Hub here?</a>'
                            });
                            google.maps.event.addListener(marker, 'click', function() {
                                infowindow.open(map, marker);
                            });
                            google.maps.event.trigger(marker, 'click');
                        }
                        //if hubs exist in that area
                        else {
                            indexWhereFound = matchExistsObject.indexFound;
                            google.maps.event.trigger(markersPinned[indexWhereFound], 'click');
                            hubsOpen.push(indexWhereFound);
                        }
                        markers.push(marker);
                    }
                    //Exact match of location found
                    else {
                        indexWhereFound = matchExistsObject.indexFound;
                        google.maps.event.trigger(markersPinned[indexWhereFound], 'click');
                        hubsOpen.push(indexWhereFound);
                    }
                    //Let's center the map to the marker position
                    map.setCenter(pos);
                    //Let's always see a Hub
                    zoomToSeeHub();

                }
            });
            /************************END SEARCH BAR EVENT ***********************************************/
        }
    });
}(jQuery));
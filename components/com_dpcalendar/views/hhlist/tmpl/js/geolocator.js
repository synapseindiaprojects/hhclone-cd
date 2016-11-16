/*jslint browser:true, nomen:true */
//for jsLint implied variable warnings:
/*global google:false */

/*
 *  Geolocator Javascript Lib
 *  version:        1.1
 *  author:         Onur YILDIRIM
 *  contact:        onur@cutepilot.com
 *  project page:   https://github.com/onury/geolocator
 *  copyright:      © 2012. MIT License.
 */
var geolocator = (function () {

    'use strict';

    /*-------- PRIVATE PROPERTIES & FIELDS --------*/

        /* Storage for the callback function to be executed when the location is successfully fetched. */
    var onSuccess,
        /* Storage for the callback function to be executed when the location could not be fetched due to an error. */
        onError,
        /* Google Maps URL. */
        googleLoaderURL = 'https://www.google.com/jsapi',
        /* Array of source services that provide location-by-IP information. */
        ipGeoSources = [
            {url: 'http://geoiplookup.wikimedia.org/', cbParam: ''}, // 0
            {url: 'http://freegeoip.net/json/', cbParam: 'callback'}, // 1
            {url: 'http://www.geoplugin.net/json.gp', cbParam: 'jsoncallback'} // 2                        
        ],
        /* The index of the current IP source service. */
        ipGeoSourceIndex = 0; // default (geoiplookup)

    /*-------- PRIVATE METHODS --------*/

    /*  Non-blocking method for loading scripts dynamically.
     */
    function loadScript(url, callback, type) {
        var script = document.createElement('script');
        script.type = (type === undefined) ? 'text/javascript' : type;

        if (typeof callback === 'function') {
            if (script.readyState) {
                script.onreadystatechange = function () {
                    if (script.readyState === 'loaded' || script.readyState === 'complete') {
                        script.onreadystatechange = null;
                        callback();
                    }
                };
            } else {
                script.onload = function () { callback(); };
            }
        }

        script.src = url;
        //document.body.appendChild(script);
        document.getElementsByTagName('head')[0].appendChild(script);
    }

    /*  Loads Google Maps API and executes the callback function when done.
     */
    function loadGoogleMaps(callback) {
        function loadMaps() {
            if (geolocator.__glcb) { delete geolocator.__glcb; }
            google.load('maps', '3', {other_params: 'sensor=false', callback: callback});
        }
        if (window.google !== undefined && google.maps !== undefined) {
            if (callback) { callback(); }
        } else {
            if (window.google !== undefined && google.loader !== undefined) {
                loadMaps();
            } else {
                geolocator.__glcb = loadMaps;
                loadScript(googleLoaderURL + '?callback=geolocator.__glcb');
            }
        }
    }
    
    function reverseGeoLookup(latlng, callback) {
        var geocoder = new google.maps.Geocoder();
        function onReverseGeo(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                if (callback) { callback(results); }
            }
        }
        geocoder.geocode({'latLng': latlng}, onReverseGeo);
    }

    /*  Fetches additional details (from the reverse-geo result) for the address property of the location object.
     */
    function fetchDetailsFromLookup(data) {
        if (data.length > 0) {
            var i, comp, comps = data[0].address_components;
            geolocator.location.formattedAddress = data[0].formatted_address;

            for (i = 0; i < comps.length; i += 1) {
                comp = comps[i];
                if (comp.types.indexOf('route') >= 0) {
                    geolocator.location.address.street = comp.long_name;
                } else if (comp.types.indexOf('neighborhood') >= 0) {
                    geolocator.location.address.neighborhood = comp.long_name;
                } else if (comp.types.indexOf('sublocality') >= 0) {
                    geolocator.location.address.town = comp.long_name;
                } else if (comp.types.indexOf('locality') >= 0) {
                    geolocator.location.address.city = comp.long_name;
                } else if (comp.types.indexOf('administrative_area_level_1') >= 0) {
                    geolocator.location.address.region = comp.short_name;
                } else if (comp.types.indexOf('country') >= 0) {
                    geolocator.location.address.country = comp.long_name;
                    geolocator.location.address.countryCode = comp.short_name;
                } else if (comp.types.indexOf('postal_code') >= 0) {
                    geolocator.location.address.postalCode = comp.long_name;
                } else if (comp.types.indexOf('street_number') >= 0) {
                    geolocator.location.address.streetNumber = comp.long_name;
                }
            }
        }
    }

    /*  Finalizes the location object via reverse-geocoding and draws the map (if required).
     */
    function finalize(coords) {
        var latlng = new google.maps.LatLng(coords.latitude, coords.longitude);
        function onGeoLookup(data) {
            if (data.length > 0) {
                fetchDetailsFromLookup(data);
            }
            if (onSuccess) { onSuccess.call(null, geolocator.location); }
        }
        reverseGeoLookup(latlng, onGeoLookup);
    }

    /*  Gets the geo-position via HTML5 geolocation (if supported).
     */
    function getPosition(fallbackToIP, html5Options) {
        geolocator.location = null;

        function fallback(errMsg) {
            var ipsIndex = fallbackToIP === true ? 0 : (typeof fallbackToIP === 'number' ? fallbackToIP : -1);
            if (ipsIndex >= 0) {
                geolocator.locateByIP(onSuccess, onError, ipsIndex);
            } else {
                if (onError) { onError.call(null, errMsg); }
            }
        }

        function geoSuccess(position) {
            geolocator.location = {
                ipGeoSource: null,
                coords: position.coords,
                timestamp: (new Date()).getTime(), //overwrite timestamp (Safari-Mac and iOS devices use different epoch; so better use this).
                address: {}
            };
            finalize(geolocator.location.coords);
        }

        function geoError(error) {
            fallback(error.message);
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(geoSuccess, geoError, html5Options);
        } else { // not supported
            fallback('geolocation is not supported.');
        }
    }

    /*  Builds the location object from the source data.
     */
    function buildLocation(sourceIndex, data) {
        switch (sourceIndex) {
        case 0: // Wikimedia
            geolocator.location = {
                coords: {
                    latitude: data.lat,
                    longitude: data.lon
                },
                address: {
                    city: data.city,
                    country: '',
                    countryCode: data.country,
                    region: ''
                }
            };
            break;        
        case 1: // freegeoip
            geolocator.location = {
                coords: {
                    latitude: data.latitude,
                    longitude: data.longitude
                },
                address: {
                    city: data.city,
                    country: data.country_name,
                    countryCode: data.country_code,
                    region: data.region_name
                }
            };
            break;
        case 2: // geoplugin
            geolocator.location = {
                coords: {
                    latitude: data.geoplugin_latitude,
                    longitude: data.geoplugin_longitude
                },
                address: {
                    city: data.geoplugin_city,
                    country: data.geoplugin_countryName,
                    countryCode: data.geoplugin_countryCode,
                    region: data.geoplugin_regionName
                }
            };
            break;
        }
        if (geolocator.location) {
            geolocator.location.coords.accuracy = null;
            geolocator.location.coords.altitude = null;
            geolocator.location.coords.altitudeAccuracy = null;
            geolocator.location.coords.heading = null;
            geolocator.location.coords.speed = null;
            geolocator.location.timestamp = new Date().getTime();
            geolocator.location.ipGeoSource = ipGeoSources[sourceIndex];
            geolocator.location.ipGeoSource.data = data;
        }
    }

    /*  The callback that is executed when the location data is fetched from the source.
     */
    function onGeoSourceCallback(data) {
        var initialized = false;
        geolocator.location = null;
        delete geolocator.__ipscb;

        function gLoadCallback() {
            if (ipGeoSourceIndex === 0) { // Wikimedia
                if (window.Geo !== undefined) {
                    buildLocation(ipGeoSourceIndex, window.Geo);
                    delete window.Geo;
                    initialized = true;
                }
            } else {
                if (data !== undefined) {
                    buildLocation(ipGeoSourceIndex, data);
                    initialized = true;
                }
            }

            if (initialized === true) {
                finalize(geolocator.location.coords);
            } else {
                if (onError) { onError('Could not get location.'); }
            }
        }

        loadGoogleMaps(gLoadCallback);
    }

    /*  Loads the (jsonp) source. If the source does not support json-callbacks;
     *  the callback is executed dynamically when the source is loaded completely.
     */
    function loadIpGeoSource(source) {
        if (source.cbParam === undefined || source.cbParam === null || source.cbParam === '') {
            loadScript(source.url, onGeoSourceCallback);
        } else {
            loadScript(source.url + '?' + source.cbParam + '=geolocator.__ipscb'); //ip source callback
        }
    }

    return {

        /*-------- PUBLIC PROPERTIES --------*/

        /* The recent location information fetched as an object.
         */
        location: null,

        /*-------- PUBLIC METHODS --------*/

        /* Gets the geo-location by requesting user's permission.
         */
        locate: function (successCallback, errorCallback, fallbackToIP, html5Options) {
            onSuccess = successCallback;
            onError = errorCallback;
            function gLoadCallback() { getPosition(fallbackToIP, html5Options); }
            loadGoogleMaps(gLoadCallback);
        },
        /* Gets the geo-location from the user's IP.
         */
        locateByIP: function (successCallback, errorCallback, sourceIndex) {
            ipGeoSourceIndex = (sourceIndex === undefined ||
                (sourceIndex < 0 || sourceIndex >= ipGeoSources.length)) ? 0 : sourceIndex;
            onSuccess = successCallback;
            onError = errorCallback;            
            geolocator.__ipscb = onGeoSourceCallback;
            loadIpGeoSource(ipGeoSources[ipGeoSourceIndex]);
        }
    };
}());
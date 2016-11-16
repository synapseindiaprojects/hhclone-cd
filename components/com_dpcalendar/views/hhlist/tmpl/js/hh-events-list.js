 (function (jq, HH) {
    var utils = new HH.Utils(),
        defaultCalendars = [],
        selectedCalendars = [],
        map = {};

    function sendRequest() {
        var dataInArray = [];
        var k = 0;
        jq('.formElements').each(function () {
            if (jq(this).val() !== "") {
                dataInArray[k] = jq(this).attr('name') + '=' + jq(this).val();
                k++;
            }
        });
        var formattedData = dataInArray.join('&');
        var url = 'index.php?option=com_api&view=calendar&format=events&layout=events&month_format=short&weekday=long&random_images=true&' + formattedData;

        var layout = 'view.box';

        var events = new HH.Events([], { url: url, limitstart: 0, usecache: false });
        new HH.EventsView({
            el: "#calendar-data",
            collection: events,
            layout: layout,
            path: "/components/com_dpcalendar/views/js-templates/"
        }).render();
        events.fetch();
    }
    function refresh(layout) {
        //layout    
        //var layout = dpjQuery("input[type='radio']:checked").val();
        var events = new HH.Events([], { usecache: true });
        new HH.EventsView({
            el: "#calendar-data",
            collection: events,
            layout: layout
        }).render();
        events.fetch();
    }
    var onGeoSuccess = function (location) {
        // Success Callback            
        var address = location.address.city + "," + location.address.region;
        createCookie('hh-events-front-page-location',address,365);
        jq("#location-selected").val(address); // city, region
        jq("#location-label").text(address);
        var latLong = "latitude=" + location.coords.latitude + ';' + "longitude=" + location.coords.longitude;
        jq('#filter-location').val(latLong); // latitude;longitude        
        //search events based on user location
        sendRequest();
    }
    var onGeoError = function (message) {
        // Error Callback
        console.log(message);
        //default location in case of error
        var address = "Ridgefield, CT";
        jq("#location-selected").val(address);
        jq("#location-label").text(address);
        jq('#filter-location').val(address);
        //populate with events
        sendRequest();
    }
    function codeAddress(selector,cookieAddress,callback) {

        var address = (cookieAddress) ? cookieAddress : jq(selector).val();
        eraseCookie('hh-events-front-page-location');
        createCookie('hh-events-front-page-location',address,365);
        window.geocoder.geocode({ 'address': address }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
               
                map.setCenter(results[0].geometry.location);
                var marker = new google.maps.Marker({
                    map: map,
                    position: results[0].geometry.location
                });
                jq(selector).val(results[0].formatted_address);
                
                //set the longitude and latitude to send request
                var id = jq(selector).attr('data-name');
                var latitude = 'latitude=' + results[0].geometry.location.lat();
                var longitude = 'longitude=' + results[0].geometry.location.lng();
                var latLong = latitude + ';' + longitude;
                jq('#' + id).val(latLong);
                if(callback!=undefined){
                    callback();
                }
               
            } else {
                alert('Geocode was not successful for the following reason: ' + status);
            }
        });
    }

    function createCookie(name,value,days) {
        if (days) {
            var date = new Date();
            date.setTime(date.getTime()+(days*24*60*60*1000));
            var expires = "; expires="+date.toGMTString();
        }
        else {
            var expires = "";
        }
        document.cookie = name+"="+value+expires+"; path=/";
    }

    function readCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) == 0){
                return c.substring(nameEQ.length,c.length);
            }
        }
        return null;
    }
    function eraseCookie(name) {
        createCookie(name,"",-1);
    }

    function updateLabel(selector, itemSelected) {
        var label = utils.validAttr(selector, 'data-label'),
            $ele = jq(selector);
        if (label !== '') {
            var altText = utils.validAttr(selector, 'data-text');
            var value = (altText === '') ? jq.trim($ele.val()) : altText;
            jq('#' + label).text(value);
            return;
        }
        label = utils.validAttr(selector, 'data-multi-label');
        if (label !== '') {
            if (itemSelected > 0)
                jq('#' + label).text('Selected ' + jq('#' + label).attr('data-text'));
            else
                jq('#' + label).text('All ' + jq('#' + label).attr('data-text'));

            return;
        }
    }
    function toggleSelectionTab(selector, counter) {
        var selectionWrapper = utils.validAttr(selector, 'data-filter-selection'),
            selectionGroup = utils.validAttr(selector, 'data-group');
        if (selectionWrapper !== '') {
            if (counter === 0) {
                jq('#' + selectionWrapper).hide();
                jq('#' + selectionWrapper + '-label').empty();
            }
            else {
                var $thisFilter = jq(selector);
                var filterId = $thisFilter.attr('id');
                jq('#' + selectionWrapper).show();
                var selection = '<a id="selection' + filterId + '" href="#" class="btn btn-mini selection-tabs" data-group="' + selectionGroup + '" data-source="' + filterId + '">' +
                        $thisFilter.parent('label').find('font').text() +
                        '<i class="icon-remove"></i></a>&nbsp;';
                if ($thisFilter.prop('checked')) {
                    jq('#' + selectionWrapper + '-label').append(selection);
                }
                else {
                    jq('#selection' + filterId).remove();
                }
            }
        }
        return;
    }
    function initialize() {
        jq(document).ajaxStart(function () {
            //disable inputs 
            jq('.dp-container :input').prop('disabled', true);
        });
        jq(document).ajaxStop(function () {
            //enable inputs
            jq('.dp-container :input').prop('disabled', false);
        });
        //lets start the mini calendar
        //jq('#datepicker').datepicker({ minDate: 0 });
        //jq('#datepicker').datepicker();
        jq('.calendars').each(function (index, ele) {
            defaultCalendars[index] = jq(ele).val();
        });
         //Clears input text
         jq("#clear").click(function(evt){
                    evt.preventDefault();
                    jq("#tags").val("").focus();
                    
         });
         /*
         jq("#clear2").click(function(evt){
                    evt.preventDefault();
                    jq("#locationSearch").val("").focus();
                    jq("#calsNear").fadeOut();
                    
         });
         */
         
         //For Search Location
         /*
         jq('#locationSearch').keypress(function(event){
 
                var keycode = (event.keyCode ? event.keyCode : event.which);
                if(keycode == '13'){
                    jq("#calsNear").fadeIn();
                }
                event.stopPropagation();
        });
        */  
    
        //Display A First 
        jq("#A").siblings().hide();
        jq('.alphabet a:first-child').addClass("active");
        //Click Event on Alphabet Letter
        jq('.alphabet > a').click(function () {
            var letter = jq(this), letterText = jq(this).text();
            jq('.alphabet > a').removeClass("active");
            letter.addClass("active");
            jq("#"+letterText).siblings().hide();
            jq("#"+letterText).show("slow");    
        });
        
                
        jq('#dialog-calendars').dialog({
            autoOpen: false,
            modal: true,
            height: "auto",
            width: "100%",
            buttons: {
                "OK": function () {
                    jq(this).dialog("close");
                    //clears input Search field
                    jq("#clear").trigger('click');
                    //closes accordion
                    jq('#accordion').accordion({
                        collapsible:true,
                        active:false
                    })
                }
            },
            
            //Does not go automatically to search
            open: function(event, ui) {
                    jq("#tags").blur();
            }
            
        });
        jq("#calendar-widget").datepicker();
        //GOOGLE STUFF
        var mapOptions = {
            zoom: 7,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            //center: new google.maps.LatLng(geoip_latitude(), geoip_longitude())
        }
        map = new google.maps.Map(document.getElementById('dpcalendar_component_map'), mapOptions);
        geocoder = new google.maps.Geocoder();
        //locate user based on his/her IP address
        var cookieExists=readCookie('hh-events-front-page-location');
        if(cookieExists==null || cookieExists=='undefined'){
            
            geolocator.locateByIP(onGeoSuccess, onGeoError, 0);
        }
        else{
           
            codeAddress('#location-selected',cookieExists,function(){
                sendRequest();
            });   
        }
        
    }
    jq(function () {
        //temp fix
        eraseCookie('location');
        initialize();
        utils.setEvents({
            events: {
                click: [
                    '#show-calendars|showCalendars',
                    '.viewlayout|changeLayout',
                    '.filter-button|toggleSection',
                    '#my-current-location|setMyCurrentLocation',
                    '.has-popover|togglePopover',
                    '#category-filter-selection,#calendar-filter-selection?.selection-tabs|removeSelectedTab',
                    '.single-filter|selection',
                    '#options|toggleDropdown',
                    '.search-options|searchOptionSelected'
                ],
                change: [
                    '.multipleFilters|selection',
                    '.filters|selection',
                ]
            },
            selection: function (e) {
                var dataObject = {},
                    $ele = '',
                    inputId = '',
                    numOfSelectedCalendars = 0,
                    updateLocation = false;
                $ele = jq(this);
                dataObject = utils.getValueAsObj(this);
                for (var key in dataObject) {
                    if (dataObject.hasOwnProperty(key)) {
                        if (key === 'ids') {
                            //should be checkboxes
                            if ($ele.prop("checked")) {
                                selectedCalendars.push(dataObject[key]);
                            }
                            else {
                                selectedCalendars = jq.grep(selectedCalendars, function (item) {
                                    return item !== dataObject[key];
                                });
                            }
                            numOfSelectedCalendars = selectedCalendars.length;
                            dataObject[key] = (numOfSelectedCalendars > 0) ? selectedCalendars.join(',') : defaultCalendars.join(',');
                            toggleSelectionTab(this, numOfSelectedCalendars);
                        }
                        if (key === 'date-start') {
                            dataObject[key] = (jq('#' + $ele.attr('id')).datepicker('getDate').getTime() / 1000).toString();
                        }
                        if (key === 'filter-location') {
                            if (dataObject[key] === '') {
                                return false;
                            }
                            updateLocation = true;
                        }
                        updateLabel(this, numOfSelectedCalendars);
                        jq('#' + key).val(dataObject[key]);
                    }
                }
                if(updateLocation){
                    codeAddress(this, false, sendRequest);
                }else{
                    sendRequest();
                }
            },
            togglePopover: function () {
                //get the ID selector of the popover
                var popOverSelector = jq(this).attr('data-popover');
                //lets get the popover
                var thisObject = jq('#' + popOverSelector);
                //we will hide all popovers but this one
                jq('.popover').not(thisObject).hide();
                var position = jq(this).position();
                thisObject.css({ "top": position.top + 30, "left": position.left - 30 });
                //show this popover
                thisObject.show();
                return false;
            },
            removeSelectedTab: function (e) {
                e.preventDefault();
                var tabSourceId = '#' + utils.validAttr(this, 'data-source');
                if (tabSourceId !== '') {
                    jq(tabSourceId).trigger('click');
                    sendRequest();
                }
            },
            changeLayout: function () {
                if (!jq(this).hasClass('view-selected')) {
                    var layoutChosen = utils.validAttr(this, 'data-layout'),
                        classToRemove = '';
                    if (layoutChosen === 'box') {
                        classToRemove = 'list-view';
                    }
                    else if (layoutChosen === 'list') {
                        classToRemove = 'box-view';
                    }
                    jq('#calendar-data')
                        .removeClass(classToRemove)
                        .addClass(layoutChosen + '-view');
                    jq(this).siblings('a').removeClass('view-selected');
                    jq(this).addClass('view-selected');
                }
                return false;
            },
            toggleDropdown: function (e) {
                e.preventDefault();
                jq(this).closest('div').toggleClass('open');
            },
            setMyCurrentLocation: function () {
                var html5Options = { enableHighAccuracy: true, timeout: 3000, maximumAge: 0 };
                geolocator.locate(onGeoSuccess, onGeoError, 0, html5Options);
                return false;
            },
            
            showCalendars: function (e) {
                e.preventDefault();

                jq('#dialog-calendars').dialog('open');
                //jq('#calsNear').hide();
                //jq('#status').hide();
                jq('#accordion').accordion({
                    collapsible:true,
                    active:false,
                    heightStyle: "content"
                });
                
                /////For Autocomplete/////
                var availableHubsOrgs=[];
                var data= jq('#accordion p font');//gets all calendar names
                var input=jq('#accordion p label input');//gets the calendar data 
                var value=[];
                for(var i = 0; i < input.length; i++){
                    value[i] = jq(input[i]).attr("value");//stores the value of calendar
                }
                for(var k = 0; k < data.length; k++){
                    availableHubsOrgs[k] = jq(data[k]).text();//stores the name of calendar
                }
            
                jq('#tags').autocomplete({
                    source:availableHubsOrgs,
                    select:function(event, ui){
                        
                        var index;
                        var end=(availableHubsOrgs.length)-1;//starts iteration from the end
                        /*Will find the location in array of selected event*/
                        for(var i=0;i<availableHubsOrgs.length;i++){ 
                            if(ui.item.value==availableHubsOrgs[i]){
                                index=i;
                                break;
                            }
                            else if(ui.item.value==availableHubsOrgs[end]){
                                index=end;
                                break;
                            }
                            end--;
                        }
                        var let=ui.item.value[0]+ui.item.value[0];
                        let=let.toUpperCase();
                        jq("#calendar"+value[index]).trigger('click');
                        jq("#accordion").accordion({active:0});
                        jq('#'+let).trigger('click');
                    }
                });
            },
            searchOptionSelected: function(e){
                e.preventDefault();
                jq(this).closest('.btn-group').removeClass('open');
            }
        });
        //hides popovers
        jq(document).click(function (e) {
            if (jq(e.target).closest(".popover-content").length > 0 ||
                jq(e.target).hasClass("has-popover")) {
                return;
            }
            jq('.popover').hide();
            if (jq(e.target).closest(".btn-group").length > 0) {
                return;
            }
            //hide dropdown
            jq('.btn-group').removeClass('open');
        });

       
        
    });
}(jQuery, HH));
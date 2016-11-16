(function(jq) {
    window.FilterHelper = {
        mFilterClass: '',
        filterClass: '',
        sorClass: '',
        popoverClass: 'popover',
        _parseEvent: function(eventInput) {
            var eventData = {selector: '', childs: '', handler: '', params: {}};
            //seperate selector from function
            if (eventInput.indexOf('|') > 1) {
                var compound = eventInput.split('|');
                var selectorData = compound[0].split('?');
                var handlerData = compound[1].split('?');
                eventData.selector = selectorData[0];
                if (selectorData.length > 1)
                    eventData.childs = selectorData[1];
                eventData.handler = handlerData[0];
                if (handlerData.length > 1) {
                    var options = handlerData[1].split('&');
                    var j = 0, length = options.length;
                    for (j; j < length; j++) {
                        eventData.params[options[j]] = options[j];
                    }
                }
            }
            return eventData;
        },
        init: function() {
            var events = FilterHelper.events;
            var k = 0;
            //lets iterate through all the events declared
            for (var e in events) {
                //lets iterate through this event
                //this event is an array which contains selector:callback
                for (k = 0; k < events[e].length; k++) {
                    var eventData = FilterHelper._parseEvent(events[e][k]);
                    var handler = FilterHelper[eventData.handler];
                    //now, only if the call back is valid (must be in this class)
                    if (eventData.handler in FilterHelper && eventData.selector !== '') {
                        //declare the event
                        jq(eventData.selector).on(e, eventData.childs, {params: eventData.params}, handler);
                    }
                }
            }
        },
        events: {
            click: [
                '.has-popover|togglePopover',
                '#category-filter-selection,#calendar-filter-selection?.selection-tabs|removeSelectedTab?sendRequest',
                '.single-filter|selection?sendRequest',
            ],
            change: [
                '.multipleFilters|multiSelection?sendRequest',
                '.filters|selection?sendRequest',
                '.sortOptions|filterOrder?sendRequest'
            ]
        },
        _updateLabel: function(selector, itemSelected) {
            var label = FilterHelper._validateAttr(selector, 'data-label');
            if (label !== '') {
                var altText = FilterHelper._validateAttr(selector,'data-text');
                var value = (altText==='')? jq.trim(selector.val()):altText;
                jq('#' + label).text(value);
                return;
            }
            label = FilterHelper._validateAttr(selector, 'data-multi-label');
            if (label !== '') {
                if (itemSelected > 0)
                    jq('#' + label).text('Selected ' + jq('#' + label).attr('data-text'));
                else
                    jq('#' + label).text('All ' + jq('#' + label).attr('data-text'));

                return;
            }
        },
        _isFunction: function(obj) {
            return !!(obj && obj.constructor && obj.call && obj.apply);
        },
        selection: function(event) {
            var thisFilter = jq(this);
            var altValueAttr = FilterHelper._validateAttr(thisFilter,'data-value');
            var value = (altValueAttr==='')? jq.trim(thisFilter.val()):altValueAttr;
            var id = thisFilter.attr('data-name');
            if (id === 'date-start') {
                //value = (parseInt(value) / 1000).toString();
				var dateObj = jq('#'+thisFilter.attr('id')).datepicker("getDate");
				value = (dateObj.getTime() /1000).toString();
            }
            if (id === 'filter-location') {
			    if(value===''){
				   return false;
				}
                codeAddress(this);
            }
            //update label if needed
            FilterHelper._updateLabel(thisFilter, 1);
            //set the input field
            jq('#' + id).val(value);
            window[event.data.params.sendRequest]();
        },
        multiSelection: function(event) {
            var thisFilter = jq(this);
            //find the group this belongs to.
            var group = thisFilter.attr('data-group');
            //create array for storage
            var values = [];
            //iterate and check for selected (group must be same as class)
            var counter = 0;
            jq('.' + group).each(function() {
                if (jq(this).prop('checked')) {
                    //store selected values in array
                    values[counter] = jq(this).val();
                    counter++;
                }
            });
            //create comma seperated string from array
            var newValues = values.join(',');
            //add new values to input field for submission
            var id = thisFilter.attr('data-name');
            jq('#' + id).val(newValues);
            //if no calendars have been selected, lets set them to default values
            if (jq('#' + id).val() === "" && id === "ids") {
                jq('#' + id).val(window.calendarDefaults.join(','));
            }
            FilterHelper._toggleSelectionTab(thisFilter, counter);
            //display message in label if available
            FilterHelper._updateLabel(this, counter);
            //submit the form
            window[event.data.params.sendRequest]();
        },
        _validateAttr: function(selector, attr) {
            return (jq(selector).attr(attr) !== undefined &&
                    jq(selector).attr(attr) !== false &&
                    jq(selector).attr(attr) !== '') ?
                    jq(selector).attr(attr) : '';
        },
        togglePopover: function(event) {
            //get the ID selector of the popover
            var popOverSelector = jq(this).attr('data-popover');
            //lets get the popover
            var thisObject = jq('#' + popOverSelector);
            //we will hide all popovers but this one
            jq('.' + FilterHelper.popoverClass).not(thisObject).hide();
            //show this popover
            thisObject.show();
            return false;
        },
        _setLocation: function(ele) {
            var url = 'http://maps.google.com/maps/api/geocode/json?address=' + jq(ele).val() + '&sensor=false';
            jq.ajax({
                url: url,
            }).done(function(response) {
                //set the formatted address
                jq(ele).val(response.results[0].formatted_address);
                //set the longitude and latitude to send request
                var id = jq(ele).attr('data-name');
                var latitude = 'latitude=' + response.results[0].geometry.location.lat;
                var longitude = 'longitude=' + response.results[0].geometry.location.lng;
                var latLong = latitude + ';' + longitude;
                jq('#' + id).val(latLong);
            }).fail(function(error) {
                alert('An error has ocurred!\n'+error);
            });
            return this;
        },
        _toggleSelectionTab: function(filter, counter) {
            //To display selection
            var selectionWrapper = FilterHelper._validateAttr(filter, 'data-filter-selection');
            var selectionGroup = FilterHelper._validateAttr(filter, 'data-group');
            //if filter selections are to display...
            if (selectionWrapper !== '') {
                if (counter === 0) {
                    jq('#' + selectionWrapper).hide();
                    jq('#' + selectionWrapper + '-label').empty();
                }
                else {
                    var thisFilter = jq(filter);
                    var filterId = thisFilter.attr('id');
                    jq('#' + selectionWrapper).show();
                    var selection = '<a id="selection' + filterId + '" href="#" class="btn btn-mini selection-tabs" data-group="' + selectionGroup + '" data-source="' + filterId + '">' +
                            thisFilter.parent('label').find('font').text() +
                            '<i class="icon-remove"></i></a>&nbsp;';
                    if (thisFilter.prop('checked')) {
                        jq('#' + selectionWrapper + '-label').append(selection);
                    }
                    else {
                        jq('#selection' + filterId).remove();
                    }
                }
            }
            return;
        },
        removeSelectedTab: function(event) {
            var tabSourceId = '#' + FilterHelper._validateAttr(this, 'data-source');
            if (tabSourceId !== '') {
                jq(tabSourceId).trigger('click');
                window[event.data.params.sendRequest]();
            }
        },
        filterOrder: function(event) {
            var selected = jq(this).val();
            var selectedArr = selected.split(',');
            if (selectedArr.length > 1) {
                var order = selectedArr[0];
                var orderDir = selectedArr[1];
                jq('#filter_order').val(order);
                jq('#filter_order_dir').val(orderDir);
                window[event.data.params.sendRequest]();
            }
        }
    };
}(dpjQuery));

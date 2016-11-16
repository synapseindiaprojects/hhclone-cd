(function($) {
    $(document).ready(function() {
        $(document).click(function(e) {
            if ($(e.target).closest(".popover-content").length > 0) {
                return;
            }
            $('.popover').hide();
        });

        $('.has-popover').click(function() {
            var popOverSelector = $(this).attr('data-popover');
            var thisObject = $('#' + popOverSelector);
            $('.popover').not(thisObject).hide();
            thisObject.show();
            return false;
        });

        $('.multipleFilters').change(function() {
            //find the group this belongs to.
            var group = $(this).attr('data-group');
            //create array for storage
            var values = [];
            //iterate and check for selected (group must be same as class)
            var counter = 0;
            $('.' + group).each(function() {
                if ($(this).prop('checked')) {
                    //store selected values in array
                    values[counter] = $(this).val();
                    counter++;
                }
            });
            //create comma seperated string from array
            var newValues = values.join(',');
            //add new values to input field for submission
            var id = $(this).attr('data-name');
            $('#' + id).val(newValues);
            //if no calendars have been selected, lets set them to default values
            if ($('#' + id).val() === "" && id === "ids") {
                $('#' + id).val(window.calendarDefaults.join(','));
            }
            _toggleSelectionTab($(this), counter)
            //submit the form
            sendRequest();
        });
        
        $("#category-filter-selection").on("click", "a.selection-tabs", function() {
            var tabSourceId = '#' + _validateAttr(this, 'data-source');
            if (tabSourceId !== '') {
                $(tabSourceId).trigger('click');               
            }
        });        

        $('.filters').change(function() {
            var value = $.trim($(this).val());
            var id = $(this).attr('data-name');
            if (id === 'date-start') {
	         var dateObject = $('#datepicker').datepicker("getDate");
                value = (dateObject.getTime()/ 1000).toString();
            }
            //set the input field
            $('#' + id).val(value);
            //submit the form
            sendRequest();
        });
        
        $('.sortOptions').change(function() {
            var selected = $(this).val();
            var selectedArr = selected.split(',');
            if (selectedArr.length > 1) {
                var order = selectedArr[0];
                var orderDir = selectedArr[1];
                $('#filter_order').val(order);
                $('#filter_order_dir').val(orderDir);
                sendRequest();
            }
        });
        
        function _toggleSelectionTab(filter, counter) {
            //To display selection
            var selectionWrapper = _validateAttr(filter, 'data-filter-selection');
            var selectionGroup = _validateAttr(filter, 'data-group');
            //if filter selections are to display...
            if (selectionWrapper !== '') {
                if (counter === 0) {
                    $('#' + selectionWrapper).hide();
                    $('#' + selectionWrapper + '-label').empty();
                }
                else {
                    var thisFilter = $(filter);
                    var filterId = thisFilter.attr('id');
                    $('#' + selectionWrapper).show();
                    var selection = '<a id="selection' + filterId + '" href="#" class="btn btn-mini selection-tabs" data-group="' + selectionGroup + '" data-source="' + filterId + '">' +
                            thisFilter.parent('label').find('font').text() +
                            '<i class="icon-remove"></i></a>&nbsp;';
                    if (thisFilter.prop('checked')) {
                        $('#' + selectionWrapper + '-label').append(selection);
                    }
                    else {
                        $('#selection' + filterId).remove();
                    }
                }
            }
            return;
        };       
               
        function  _validateAttr(selector, attr) {
            return ($(selector).attr(attr) !== undefined &&
                    $(selector).attr(attr) !== false &&
                    $(selector).attr(attr) !== '') ?
                    $(selector).attr(attr) : '';
        }
        
        function sendRequest() {
            var dataInArray = [];
            var k = 0;
            $('.formElements').each(function() {
                if ($(this).val() !== "") {
                    dataInArray[k] = $(this).attr('name') + '=' + $(this).val();
                    k++;
                }
            });
            var formattedData = dataInArray.join('&');
            //var url = '/api/events?' + formattedData + '&random_images=true';
            var url = '/index.php?option=com_api&view=calendar&format=events&layout=events&random_images=true&' + formattedData;
            //layout
            //var layout = $("input[type='radio']:checked").val();        
            var events = new HH.Events([], {url: url, limitstart: 0, usecache: false});
            new HH.EventsView({
                el: "#maincontent",
                collection: events,
                layout: "view.api.box"
            }).render();
            events.fetch();
        }

        //lets start the mini calendar
        $('#datepicker').datepicker({dateFormat: "dd-mm-yy"});
        //initial display
        sendRequest();
      
        //resize the canvas size to fit contents
        $("#maincontent").on("rendered", function() {
            var heightOffset = Math.abs(this.scrollHeight - this.offsetHeight) + 25;
            var targetUrl = decodeURIComponent(document.location.hash.replace(/^#/, ''));            
            var name = window.name;
            var channelInfo = HH.QS.decode($("#channel_info").val());
            HH.Canvas.setSize({
                "target": parent,
                "targetUrl": targetUrl,
                "name": name,
                "cb": channelInfo.cb,
                "heightOffset": heightOffset                
            });
        });
    });
})(dpjQuery);

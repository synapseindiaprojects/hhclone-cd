(function(_, Backbone, jq, HH) {
    var calendarSelector = '',
            viewSelector = '',
            messageBox = '',
            controlBox = '',
            EventsManager = EventsManager || {},
            utils = new HH.Utils();


    /*BACKBONE VIEWS*/
    EventsManager.EventsView = Backbone.View.extend({
        initialize: function() {
            this.layout = this.options.layout;
            this.path = (this.options.path) ? this.options.path : '/components/com_dpcalendar/views/hhlist/tmpl/js/tmpl/';
            this.title = this.options.title || '';
            this.searchBar = this.options.searchBar || '';
            this.params = this.options.params || {};
            this.collection.bind('_loading_complete', this.labelEvents, this);
        },
        labelEvents: function(){
            //get calendar selected
            var calendarId = jq('#jform_mycalendar').val();
            if(calendarId !== '' && calendarId > 0){
                jq('#events-to-manage .simple-card-li').each(function(index,element){
                    var calIdFound = jq(element).find('.event-calendar-id').val();
                    if(calendarId !== calIdFound){
                        jq(this).css('background','#f1ecce');
                    }
                });
            }
        },
        render: function() {
            //get the list of events
            var eventsList = new HH.EventListView({
                collection: this.collection,
                layout: this.layout,
                path: this.path,
                params: this.params
            });
            //we'll need the load more button
            var loadMore = new HH.EventControlsView({collection: this.collection});
            //we'll need the empty message
            var empty = new EventsManager.EmptyView({
                collection: this.collection,
                bind: '_no_results'
            });
            //check for previous search
	    var entered = jq('#search-events').val() || '';
            //set the sub-views
            this.$el.html(this.title);
            if (this.searchBar === true) {
                var sbHtml = '<!--SEARCH BAR -->' +
                        '<div class="search-bar-wrapper input-append">' +
                        '<input value="'+entered+'" id="search-events" class="filters" type="text" name="keywordSearch" placeholder="search events" style="vertical-align:middle;" />' +
                        '<button class="btn submit-search" style="background: #5CA798;">' +
                        '<i class="icon-search icon-white"></i></button>' +
                        '</div>' +
                        '<!--SEARCH BAR -->';
                this.$el.append(sbHtml);
            }
            this.$el.append(eventsList.el);
            this.$el.append(loadMore.el);
            this.$el.append(empty.el);
            var self = this;
            eventsList.bind("_hhevents_rendered", function() {
                self.collection.trigger('_loading_complete');
            });
        }
    });
    /**
     * Messaged displayed when zero events are returned
     */
    EventsManager.EmptyView = Backbone.View.extend({
        initialize: function() {
            this.bindCall = this.options.bind;
            this.collection.bind(this.bindCall, this.render, this);
        },
        tagName: 'div',
        render: function() {
            var content = '<i>No more events...</i>';
            this.$el.html(content);
            return this;
        }
    });

    function cacheSelectors() {
        calendarSelector = jq('#jform_mycalendar');
        viewSelector = jq('#task-selection');
        messageBox = jq('#message-box');
        controlBox = jq('#task-controller');
        refreshList();
    }
    function fetchEvents(selection) {
        if (utils.isValidVar(selection.calendarId) && selection.calendarId !== '' && utils.isValidVar(selection.state)) {
            //the data
            var field = (selection.sortField !== '') ? selection.sortField : 'start_date';
            var direction = (selection.sortDirection !== '') ? selection.sortDirection : 'desc';
            var keywords = (utils.isValidVar(selection.keywordSearch) && selection.keywordSearch !== '') ? selection.keywordSearch : '';
            var isPending = (utils.isValidVar(selection.pending)) ? '1' : '';
            var state = (selection.state === '-1') ? '0'  : selection.state;
            var dataInArray = [
                "calendar_ids=" + selection.calendarId,
                "keywords=" + keywords,
                "start_date=946746000",
                "state=" + state,
                "limit=15",
                "sort=" + field,
                "sort_dir=" + direction,
                "pending=" + isPending,
                "managing=true",
                "no_includes=true"];
            var formattedData = dataInArray.join('&');
            var url = 'index.php?option=com_api&view=calendar&format=events&layout=events&' + formattedData;
            var parameters = selection.params;
            var title = viewSelector.find('.selected').text();
            var collection = new HH.Events([], {url: url, limitstart: 0, usecache: false});
            new EventsManager.EventsView({
                el: "#events-to-manage",
                collection: collection,
                layout: 'update.manage.events',
                path: '/components/com_dpcalendar/views/js-templates/',
                title: '<h4 class="title ' + title.toLowerCase() + ' ">' + title + '</h4>',
                searchBar: true,
                params: parameters
            }).render();
            collection.fetch();
        }
        else {
            jq("#events-to-manage").html("<i>Please select a calendar...</i></h3>");
        }
        return;
    }
    function refreshList() {
        var selection = getSelection();
        fetchEvents(selection);
        updateControls(selection.state);
        viewControlBox(false);
    }
    function getSelection() {
        var obj = {};
        obj = utils.getFieldValuesAsObj('.filters');
        //we don't have control over the calendar
        obj.calendarId = calendarSelector.val() || '';
        if (utils.isValidVar(obj.state)) {
            //additional items
            var params = {
                publish: obj.publishOption,
                ignore: obj.ignoreOption,
                publishClass: (obj.state === '1') ? 'hide' : 'btn-success icon-ok',
                ignoreClass: (obj.state === '1') ? 'btn-danger icon-remove' : 'btn-info icon-trash'
            };
            obj.params = params;
        }
        return obj;
    }
    function displayMessage(message, status, fade) {
        messageBox.removeClass();
        messageBox.find('span').html(message);
        messageBox.addClass('alert alert-' + status).slideToggle();
        if (fade) {
            messageBox.delay(5000).fadeOut('slow');
        }
    }
    function removeMessage() {
        messageBox.removeClass();
        messageBox.find('span').html('');
        messageBox.hide();
    }
    function eventAction(task, arrayOfEventIds) {
        var ids = arrayOfEventIds.join(',');
        var calendarId = calendarSelector.val();
        var url = 'index.php?option=com_api&task=calendar.updateEvent&action=' + task + '&calendar_id=' + calendarId + '&event_id=' + ids;
        var selection = utils.getValueAsObj('#task-selection .filters');
        if(utils.isValidVar(selection.pending) && selection.pending === 'true'){
            url+= '&pending=1';
        }
        var message = 'Processing...',
                status = 'info';
        //displayMessage(message, status, false);
        jq.ajax({
            url: url
        }).done(function(response) {
            var data = JSON.parse(response);
            message = data.data.message;
            status = 'success';
        }).fail(function(response) {
            var data = JSON.parse(response);
            message = data.data.message || '<b>Request failed.</b> Please try again or contact support.';
            status = 'error';
        }).always(function(response) {
            removeMessage();
            displayMessage(message, status, true);
            if (status === 'success') {
                refreshList();
            }
        });
    }
    function viewControlBox(show) {
        if (show) {
            controlBox.show();
        }
        else {
            controlBox.hide();
        }
    }
    function isEventSelected() {
        var isSelected = false;
        isSelected = (jq('#events-to-manage :checkbox:checked').length > 0) ? true : false;
        return isSelected;
    }
    function updateControls(selection) {
        //viewing published
        if (selection === '1') {
            controlBox.find('.btn-success').addClass('hide');
            controlBox.find('.btn-info').addClass('hide');
            controlBox.find('.btn-warning').addClass('hide');
            //show only unpublished option
            controlBox.find('.btn-danger').removeClass('hide');
        }
        //viewing pending
        else if(selection === '-1'){
            controlBox.find('.btn-info').addClass('hide');
            controlBox.find('.btn-danger').addClass('hide');
            //show discard and publish
            controlBox.find('.btn-success').removeClass('hide');
            controlBox.find('.btn-warning').removeClass('hide');
        }
        //viewing unpublished
        else {
            controlBox.find('.btn-success').removeClass('hide');
            controlBox.find('.btn-info').removeClass('hide');
            controlBox.find('.btn-danger').addClass('hide');
            controlBox.find('.btn-warning').addClass('hide');
        }
    }
    jq(function() {
        cacheSelectors();
        utils.setEvents({
            events: {
                click: [
                    '.dropdown-selection?.options|dropdownSelection',
                    '#events-to-manage?.preview-event|previewEvent',
                    '#events-to-manage?.event-action|quickTaskAction',
                    '#events-to-manage?.event-selected|eventSelected',
                    '.control-action|taskAction',
                    '.dropdown-toggle|toggleDropdown',
                    '#events-to-manage?.submit-search|submitSearch'
                ],
                change: [
                    calendarSelector.selector + '#jform_mycalendar|calendarSelection',
                    '#events-to-manage?#search-events|submitSearch'
                ]
            },
            submitSearch: function() {
                refreshList();
            },
            calendarSelection: function() {
                if (calendarSelector.val() !== '' || calendarSelector.val() > 0) {
                    jq('#control-box').show();
                }
                else {
                    jq('#control-box').hide();
                }
                refreshList();
            },
            dropdownSelection: function(e) {
                e.preventDefault();
                var selection = jq(this);
                if (!selection.hasClass('selected')) {
                    selection.addClass('selected');
                }
                selection.parent('li').siblings().find('a').removeClass('selected');
                refreshList();
                selection.closest('div').removeClass('open');
            },
            toggleDropdown: function(e) {
                e.preventDefault();
                jq('.btn-group').removeClass('open');
                jq(this).closest('div').toggleClass('open');
            },
            previewEvent: function() {
                jq(this).colorbox({iframe: true, width: "80%", height: "80%"});
            },
            eventSelected: function() {
                viewControlBox(isEventSelected());
            },
            quickTaskAction: function() {
                var task = jq(this).attr('data-task');
                var eventId = jq(this).attr('data-event-id');
                //make array
                var eventArray = [];
                eventArray.push(eventId);
                eventAction(task, eventArray);
                return false;
            },
            taskAction: function() {
                if (!isEventSelected()) {
                    return false;
                }
                var selectedEvents = jq('#events-to-manage :checkbox:checked').map(function() {
                    return jq(this).val();
                }).get();
                var task = jq(this).attr('data-task');
                eventAction(task, selectedEvents);
            }
        });
        jq(document).click(function(e) {
            if (jq(e.target).closest(".btn-group").length > 0 ||
                    jq(e.target).hasClass("dropdown-toggle")) {
                return;
            }
            jq('.btn-group').removeClass('open');
        });
        jq(window).scroll(function() {
            if (jq(this).scrollTop() > 335) {
                jq('#control-box').addClass('fixed');
            } else {
                jq('#control-box').removeClass('fixed');
            }
        });
    });

})(_, Backbone, dpjQuery, HH);
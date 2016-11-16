(function(_, Backbone, $) {
    'use strict';
    // Save a reference to the global object (`window` in the browser).
    var HH = window.HH || {};
    
    // Event Model
    var _event = HH.Event = Backbone.Model.extend({
        defaults: {
            id: '',
            title: '',
            venue: '',
            price: '',
            startdate: '',
            enddate: '',
            imageurl: '',
            item_class: 'simple-card-li round customisable-border'
        }
    }),

    //Event collection
    _events = HH.Events = Backbone.Collection.extend({
        initialize: function(models, options) {
            this.url = options.url;
            this.usecache = options.usecache;
            this.limitstart = (options.limitstart ? options.limitstart : 0);
        },
        model: _event,
        url: function() {
            return this.url;
        },
        parseResponse: function(response) {
            var locations = response.location,
            address = '',
            locationTrimmed='',
            calendarPageLink=response.url.substr(0,response.url.indexOf('/events/')),
            emailSubject=response.title.replace(' ','%20');
            if (locations && locations.length > 0) {

                //address = locations[0].formatted_address;
                if(locations[0].number!='' || locations[0].street!=''){
                    address = locations[0].number+' '+locations[0].street+'<br>';
                }
				/*address = locations[0].number+' '+locations[0].street+'<br>' +*/
                
				address=address+locations[0].city+' '+locations[0].state+', '+locations[0].zip+'<br>' +
				        'approx. dist. '+locations[0].distance+' mi';

                locationTrimmed=locations[0].city+', '+locations[0].state;
            }
            var hhEvent = new HH.Event({
                id: response.id,
                title: response.title,
                image: response.image_url,
                price: response.price,
                url: response.url,
                startdate: response.date.start.formatted_date,
                enddate: response.date.end.formatted_date,
                start_date: response.date.start.weekday+' '+response.date.start.month+' '+response.date.start.month_day+' '+response.date.start.time,     
                end_date:  response.date.end.weekday+' '+response.date.end.month+' '+response.date.end.month_day+' '+response.date.end.time, 
                start_date_full: response.date.start,     
                end_date_full:  response.date.end,     
                location: address,
                distance: (locations[0]) ? locations[0].distance : '',
                calendar_name: response.calendar_name,
                calendar_id: response.calendar_id || '',
                date: response.date,
                location_trimmed:locationTrimmed,
                email_subject:emailSubject,
                calendar_page_link:calendarPageLink,
                icon_image:response.icon_image
            });
            return hhEvent;
        },
        fetch: function() {
            var self = this;
            if (this.usecache) {
                //fetches the data from cache store
                var _hhevents_cached = _cacheManager.get('hhevents');
                self.limitstart = 0;
                _hhevents_cached.each(function(model) {
                    self.add(model);
                });
                self.url = _hhevents_cached.url;
                self.trigger('_hhevents_fetched');
                _cacheManager.store('hhevents', self);
            } else {
                // makes the server call to fetch the data
                self.limitstart = self.length;
                var url = self.url + '&limitstart=' + self.limitstart,
                    limit = url.match(/limit=([^&]+)/)[1];
                $.ajax({
                    url: url,
                    dataType: 'json',
                    cache: false
                }).done(function(results) {
                    var len = results.length;
                    for (var i = 0; i < len; ++i) {
                        self.add(self.parseResponse(results[i]));
                    }
                    if(len<1){
		        self.trigger('_no_results');
		    }
                    var postFetchSize = self.length;
                    if (self.limitstart !== postFetchSize) {
                        self.trigger('_hhevents_fetched');                        
                    } 
                    
                    if (self.limitstart === postFetchSize || len < limit) {                        
                        self.trigger('_hhevents_fetch_complete');
                    } else {
                        self.trigger('_hhevents_fetch_remaining');
                    } 
                    _cacheManager.store('hhevents', self);
                }).fail(function(error) {
                    //alert('Oops, something went wrong!!!');
                    console.log(error);
                });
            }
        }
    });

    //Event view
    HH.EventsView = Backbone.View.extend({
        initialize: function(options) {
            this.layout = options.layout;
            this.path = options.path;
        },
        render: function() {
            //temporary
            var self = this,
                path = (this.path) ? this.path : '/components/com_dpcalendar/views/hhlist/tmpl/js/tmpl/',
                eventControlsView = new HH.EventControlsView({collection: this.collection}),
                eventListView = new HH.EventListView({
                    collection: this.collection,
                    layout: this.layout,
                    path: path,
                    attributes: function() {
                        var className = '';
                        if (self.layout === 'view.box' || self.layout === 'view.api.box') {
                            className = 'name-card search-result search-card cardList';
                        } else {
                            className = 'event-listing-container';
                        }
                        return {
                            'class' : className
                        };
                    }
                });
            this.$el.html(eventListView.el);
            this.$el.append(eventControlsView.el);            
            eventListView.bind('_hhevents_rendered', function() {
                self.$el.trigger('rendered');
            });
        }
    });

    //Event controls view
    HH.EventControlsView = Backbone.View.extend({
        initialize: function() {
            this.listenTo(this.collection, '_hhevents_fetch_remaining', this.render);
            this.listenTo(this.collection, '_hhevents_fetch_complete', this.hide_load_more);
        },
        tagName: 'div',
        attributes: function() {
            return {
                id: 'calendar-data-controls',
                style: 'text-align:center'
            };
        },
        events: {
            'click #loadmore': 'handle_loadmore'
        },
        render: function() {
            this.$el.html('<span id="loadmore" class="btn">Show more&nbsp;<i class="icon-chevron-down"></i></span>');
            return this;
        },
        handle_loadmore: function() {
            this.collection.usecache = false;
            this.collection.fetch();
        },
        hide_load_more: function() {
            this.$el.html('');
        }
    });


    //List of events view
    HH.EventListView = Backbone.View.extend({
        initialize: function(options) {
            this.listenTo(this.collection, '_hhevents_fetched', this.render);
            this.params = options.params||{};
            this.layout = options.layout;
            this.path = options.path;
        },
        tagName: 'ul',
        render: function(allEvents) {
            var self = this,
            offset = allEvents ? 0 : self.collection.limitstart;
            _templateManager.get(this.path,this.layout, function(template) {
                var events = self.collection.slice(offset, self.collection.length);
                _.each(events, function(event) {
                    var hhEventView = new HH.EventView({
                        model: event,
                        template: template,
                        params: self.params
                    });
                    self.$el.append(hhEventView.render().el);
                });
                //
                self.trigger('_hhevents_rendered');                
            });
            return this;
        }
    });

    //Single event view
    HH.EventView = Backbone.View.extend({
        initialize: function(options){
            this.params = options.params;
            this.template = options.template;
        },
        tagName: 'li',
        attributes: function() {            
            return {
                'class' : this.model.get('item_class')
            };
        },
        events: {
            'click .fbshare-event': 'handle_fbshare_event',
            'click .tweet-event': 'handle_tweet_event'
        },
        render: function() {            
            var compiledTemplate = _.template(this.template, {
                event: this.model,
                params: this.params,
                _: _
            });
            $(this.el).html(compiledTemplate);
            return this;
        },
        handle_fbshare_event: function() {
	        var fullUrl = this.model.get('url');
            window.open('https://www.facebook.com/sharer/sharer.php?u=' +
                    encodeURIComponent(fullUrl), 'facebook-share-dialog',
                    'width=626,height=436');
        },
        handle_tweet_event: function() {
            //We get the URL of the link
            var loc = this.model.get('url'),
            //We get the title of the link
            title = encodeURIComponent(this.model.get('title'));

            //We trigger a new window with the Twitter dialog, in the middle of the page
            window.open('http://twitter.com/share?url=' + encodeURIComponent(loc) + '&text=' + title + '&', 'twitterwindow', 'height=450, width=550');


        }
    });

    //loads the templates asynchronously    
    function TemplateLoader() {
        var _templates = {},
            loadTemplateAsync = function(path,name) {
            _templates[name] =  _templates[name] || $.get(path + name + '.html?v=1.3');
            return _templates[name];
        };

        return {
            // Get template by name
            get: function(path,name, callback) {
                var promise = loadTemplateAsync(path,name);
                promise.done(function(template) {
                    if (callback) {
                        callback(template);
                    }
                });
            }
        };
    }
    //caches the fetched records
     function Cache() {
        var constructors = {
            'hhevents': _events
        },
        collections = {};

        return {
            get: function(name) {
                if (!collections[name]) {
                    collections[name] = new constructors[name]([], {});
                }
                return collections[name];
            },
            store: function(name, value) {
                collections[name] = value;
            }
        };
    }
    var _templateManager = new TemplateLoader(),
        _cacheManager = new Cache();

    window.HH = HH;
})(_, Backbone, jQuery);
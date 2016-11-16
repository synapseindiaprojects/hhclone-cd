(function($, HH, _, Backbone){
	'use strict';
	
	var utils = new HH.Utils(),
	reRender = false,
	calendarId = 0,
	eventsCollection = new HH.Events([], {limitstart: 0, usecache: false });

	function sendRequest() {
		var dataInArray = [];
		var k = 0;
		$('.search-criteria').each(function () {
			if ($(this).val() !== '') {
				dataInArray[k] = $(this).attr('name') + '=' + $(this).val();
				k++;
			}
		});
		reRender = true;
		eventsCollection.url = 'index.php?option=com_api&view=calendar&format=events&layout=events&calendar_ids='+calendarId+'month_format=short&weekday=long&random_images=true&' + dataInArray.join('&');
		eventsCollection.reset();
		eventsCollection.fetch();
	}

	var EventView=Backbone.View.extend({
		initialize: function(){
			
			this.template = _.template($('#eventElement').html());
		},
		render:function(){
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		}
	}),
	AllEventsListView =Backbone.View.extend({
		initialize: function(){

			this.listenTo(this.collection , 'list_view', this.render);
		},
		tagName:'div',
		attributes: function(){
			return{
				style: 'margin-bottom:15px;'
			};
		},
		render: function(){
			var collectlength=this.collection.length,
			html='',currdate='',prevdate='';

			this.collection.each(function(event,index){

				var eventview= new EventView({
					model:event
				});
				currdate = event.get('date').start.month + ' ' +event.get('date').start.month_day;
				var dateformat = currdate +', '+event.get('date').start.year;
				

				if(currdate!=prevdate){
					prevdate=currdate;
					if(index!==0){
						html=html+'</div></div>';
					}
					html=html+'<div id="day"><h4>'+dateformat+'</h4><div id="'+currdate+'" class="day-events">';
				}
				html=html+'<li class="event-container">'+eventview.render().$el.html()+'</li>';
				
				if(index==collectlength-1){
					html=html+'</div></div>';
				}

			},this);

			this.$el.html(html);
			return this;
		}
	}),
Gridview = HH.EventListView.extend({
	initialize: function(options) {
		this.params = options.params||{};
		this.unbind();
		this.listenTo(this.collection,'grid_view', this.render);
	},
	layout: 'view.box',
	path: '/components/com_dpcalendar/views/js-templates/',
	attributes: function() {
		return {
			'class': 'name-card search-result search-card cardList'
		};
	}
}),

WrapperView = HH.EventsView.extend({
	initialize:function(){
		this.listenTo(this.collection, '_hhevents_fetched', this.setView);
		this.listenTo(this.collection, '_no_results', this.noResults);
		this.state = 'grid';
		this.render();

	},
	render:function(){
		this.$subEl = $('<div><div style="position:relative;text-align:center;"><img src="/components/com_hamlethub/assets/images/loading.gif" style="width:15%;" align="middle"/></div></div>');
		this.$subEl.attr('id', 'event-holder');
		var eventControlsView = new HH.EventControlsView({collection: this.collection});
		this.gridView = new Gridview({
			tagName: 'ul',
			collection: this.collection
		});
		this.listView = new AllEventsListView({
			collection: this.collection
		});
		this.$el.html(this.$subEl);
		this.$el.append(eventControlsView.el);            
	},
	noResults: function(){
		
		this.$subEl.html('<div><i>No events found. Try to search in <a href="http://'+location.host+'" style="text-decoration:underline;"> all calendars</a>.</i></div>');
	},
	setView: function(options){
		var self = this;
		if(reRender && this.state === 'grid'){
			this.gridView = new Gridview({
				tagName: 'ul',
				collection: this.collection
			});
			reRender = false;
		}
		self.$subEl.html(self[this.state+'View'].el);
		this.collection.trigger(this.state+'_view', options);
	}


});

$(function(){

	$(window).scroll(function(){

		var cScroll=$(window).scrollTop()+$(window).height(),
			docHeight=$(document).height()-20;
		if(cScroll>=docHeight){

			$('#loadmore').animate({
				color:'#31C2B7',
				fontSize:'18px',
				borderBottomColor:'#31C2B7'},200);
		}
	});

	calendarId = $('#calID').val();
	eventsCollection.url = 'index.php?option=com_api&view=calendar&format=events&layout=events&calendar_ids='+calendarId+'&limit=12&random_images=true';

	var layoutView = new WrapperView({
		el: '#upcoming-events',
		collection: eventsCollection
	});
	eventsCollection.fetch();

	$('#view-layout').on('click', function(){
		var $el = $(this);
		if($el.hasClass('icon-list')){
			layoutView.state='list';
		}else{
			layoutView.state='grid';
			reRender = true;
		}
		layoutView.setView({renderAll: true});
		$el.toggleClass('icon-list icon-th-large');
	});

	utils.setEvents({
		events: {
			change: [
			'.upcoming-search|selection',
			'.date-filter|selection'
			],
			click: [
			'#datepicker-button|showCalendarWidget'
			]
		},
		showCalendarWidget: function(){
			$('#datepicker').datepicker('show');
		},
		selection: function () {
			var dataObject = utils.getValueAsObj(this);
			for (var key in dataObject) {
				if (dataObject.hasOwnProperty(key)) {
					if(key=='search-date'){
						var dateObj = $('#datepicker').datepicker('getDate');
						var value = (dateObj.getTime() /1000).toString();
						dataObject[key]=value;
					}
					$('#' + key).val(dataObject[key]);
				}
			}
			sendRequest();
		}
	});
	$( '#datepicker' ).datepicker();

	
	
	

});
}(jQuery, HH, _, Backbone));
(function($){

	function getMoreEvents(latitude,longitude){

		var dataInArray = [],
        	k = 0;
        $('.formElements').each(function () {
            if ($(this).val() !== "") {
                dataInArray[k] = $(this).attr('name') + '=' + $(this).val();
                k++;
            }
        });
        var formattedData = dataInArray.join('&'),
        	url = 'index.php?option=com_api&view=calendar&format=events&layout=events&month_format=short&weekday=long&random_images=true&' + formattedData;

		$.ajax({
            url:url,
            type:'post',
            success:function(data){
                var result=$.parseJSON(data);
                for(var i=0;i<result.length;i++){
                	var eventData=result[i],
                		calName=(eventData.calendar_name)?eventData.calendar_name:eventData['calendar name'],
                		date=eventData.date.start.weekday+' '+eventData.date.start.month+' '+eventData.date.start.month_day+' '+eventData.date.start.time,
                		icon=eventData.icon_image,
                		image=eventData.image_url,
                		title=eventData.title,
                		url=eventData.url,
                		endDate=eventData.date.end.formatted_date,
                		location=eventData.location[0].city+', '+eventData.location[0].state;
                	
                	$('.moreEvents .cardList').append(buildHtml(calName,date,endDate,icon,image,title,url,location));
                	i++;
                }             
               
            },
            error:function(e){
                
            }   
         });

	}

	function buildHtml(name,date,endDate,icon,image,title,url,location){
		var noImage=(image[0]=='#')?true:false,
			firstLetter=name[0],
			titleTexture=(title.length>35)?title.substring(0,35):title,
			trimmedTitle=(title.length>40)?title.substring(0,40):title,
			calLink=url.substring(0,url.indexOf('/events/'));

		var html='<li class="simple-card-li round customisable-border"><div class="simple-card">'+
					'<div class="cal-icon-container-box" style="background:'+icon+';" title="'+name+' Calendar"><a href="'+calLink+'">'+firstLetter+'</a></div>'+
    				'<a href="'+url+'" style=';
    	if(noImage){
    		html+='"background:'+image+';"';
    	}
    	else{

    		html+='"background-image:url('+image+');"';
    	}
    	html+='overflow="hidden" class="card-photo nametag-photo thumbnail">';

    	if(noImage){
    		html+=' <div class="card-overlay-box card-overlay-text-box">'+titleTexture+'</div>';
    	}
    	html+='</a></div><div class="doc-content group-info"><a href="'+url+'"><span id="event-title-box" class="event-info-box">'+trimmedTitle+'</span></a>'+
    		'<div class="ellipsize event-info-box">'+                
        		'<span class="start-date">'+date+'</span>'+               
    			'</div><span class="event-info-box">'+location+'</span></div>'+  
				'<div class="social-share-box">'+
				'<a href="#" class="social fbshare-event icon-facebook" data-url="'+url+'" onclick="return false;"></a>'+ 
				'<a href="#" class="social tweet-event icon-twitter" data-url="'+url+'"  data-title="'+title+'" onclick ="return false;"></a>'+
				'</div><div class="clearfix"></div></li>';

		return html;
	}

	function shareFacebook(url){
		window.open('https://www.facebook.com/sharer/sharer.php?u=' +
                    encodeURIComponent(url), 'facebook-share-dialog',
                    'width=626,height=436');
	}

	function shareTwitter(url,title){
		 title = encodeURIComponent(title);
         window.open('http://twitter.com/share?url=' + encodeURIComponent(url) + '&text=' + title + '&', 'twitterwindow', 'height=450, width=550');
	}

	function searchEvent(searchText,searchLocation,searchDate,searchDistance){

		if(searchLocation!=''){
			eraseCookie('hh-events-front-page-location');
        	createCookie('hh-events-front-page-location',searchLocation,365);
		}
		var $form = $("<form/>").attr("id", "data_form")
                            .attr("action", "/search-events")
                            .attr("method", "post");
            $("body").append($form);
 
            //Append the values to be send
            addParams($form, "searchText",searchText);
            addParams($form, "searchLocation", searchLocation);
            addParams($form, "searchDate", searchDate);
            addParams($form, "searchDistance", searchDistance);
 
            //Send the Form
            $form[0].submit();
	}
	function addParams(form, name, value) {
        var $input = $("<input />").attr("type", "hidden")
                                .attr("name", name)
                                .attr("value", value);
        form.append($input);
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

    function eraseCookie(name) {
        createCookie(name,"",-1);
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

	$(function(){

		var eventsNumberCookie=readCookie('HH-Calendar-Events-Number');

		if(eventsNumberCookie!=null && eventsNumberCookie!=undefined && eventsNumberCookie!=''){
			$('.moreEvents #numberOfEvents').text(eventsNumberCookie);
		 }

		$('#date-input').datepicker({
        	beforeShow: function() {
                $('#ui-datepicker-div').addClass('datepicker-custom');
            }
 		});
 		$('#date-input').datepicker('setDate',new Date());

		var location=$('.dp-location'),
			latitude=location.attr('data-latitude'),
			longitude=location.attr('data-longitude');
		$('#filter-location').val('latitude='+latitude+';longitude='+longitude);
		getMoreEvents();

		
		$('.gf-menu').children('li').children('a').addClass('custom-mi-text');

		
		$('#search-container .more-filters').on('click',function(){

			if($(this).hasClass('icon-chevron-down')){
				$(this).removeClass('icon-chevron-down').addClass('icon-chevron-up');
				$('#more-search-options').slideDown();
			}
			else{
				$(this).removeClass('icon-chevron-up').addClass('icon-chevron-down');
				$('#more-search-options').slideUp();
			}
			
		});

		//Main Event Social Icons Events
		$('.dp-container .social-share-box .fbshare-event').on('click',function(){
			var url=window.location.href;
			shareFacebook(url);
		});
		$('.dp-container .social-share-box .tweet-event').on('click',function(){
			var url=window.location.href,
				title=$('#event-title').text().trim();
			shareTwitter(url,title);
		});


		//On bottom events Social Icons Events
		$('.moreEvents .cardList').on('click','.simple-card-li .social-share-box .fbshare-event',function(){	
			var url=$(this).attr('data-url');
			shareFacebook(url);
		});

		$('.moreEvents .cardList').on('click','.simple-card-li .social-share-box .tweet-event',function(){
			var url=$(this).attr('data-url'),
				title=$(this).attr('data-title');
			shareTwitter(url,title);
		});

		

		var searchInput=$('.fs-search #search-input'),
			searchLocation=$('.fs-search #location-input'),
			searchDate=$('.fs-search #date-input'),
			searchDistance=$('.fs-search #distance-input'),
			locationDefault=readCookie('hh-events-front-page-location');
		if(locationDefault!=null){
			searchLocation.val(locationDefault);
		}

		$('#search-container').on('click',function(){
				$('.fs-search').fadeIn('fast');
				$('.fs-search #search-input').focus();
		});

		if($('.fs-search .input-container input').val()!=""){
			$('.fs-search .icon-search').addClass('ready-to-search');
			$('.more-container').slideDown();
		}
		
		$('.fs-search .icon-remove').on('click', function(){
			$('.fs-search').hide();
		});
		$('.fs-search .icon-search').on('click',function(){
			if($(this).hasClass('ready-to-search')){
				searchEvent(searchInput.val(),searchLocation.val(),searchDate.val(),searchDistance.val());
			}
		});
		searchInput.keyup(function(e){
			var searchIcon=$('.fs-search .icon-search');
			if($(this).val().length==0){
				searchIcon.removeClass('ready-to-search');

			}
			else{
				searchIcon.addClass('ready-to-search');
				$('.more-container').slideDown();
			}
			if(e.keyCode==13){
				$('.fs-search .icon-search').trigger('click');
			}
		});


		//If users click outside the search area, the full-screen search page will hide
		$('.fs-search').mouseup(function(e)
    	{

        	if(e.target.className != 'input-container' && e.target.className != 'more-container' && !$(e.target).parents('.input-container').length && !$(e.target).parents('.more-container').length)
        	{
            	$('.fs-search').fadeOut();
       		}
    	});

	});

}(jQuery))
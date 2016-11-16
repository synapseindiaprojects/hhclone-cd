<?php
/**
* @package		DPCalendar
* @author		Digital Peak http://www.digital-peak.com
* @copyright	Copyright (C) 2012 - 2013 Digital Peak. All rights reserved.
* @license		http://www.gnu.org/licenses/gpl.html GNU/GPL
*/

defined('_JEXEC') or die();

JHtml::addIncludePath(JPATH_COMPONENT . '/helpers');

DPCalendarHelper::loadLibrary(array('jquery' => true, 'maps' => true, 'bootstrap' => true, 'dpcalendar' => true));

$document = JFactory::getDocument();
$document->addStyleSheet(JURI::base().'components/com_dpcalendar/views/event/tmpl/default.css');

$document->addStyleSheet(JURI::base().'components/com_dpcalendar/views/event/tmpl/event-style.css?v=1.2');			
$document->addScript(JURI::base().'components/com_dpcalendar/views/event/tmpl/more-events.js?v=1.4');
$document->addScript(JURI::base().'components/com_dpcalendar/views/event/tmpl/event.js');
$document->addScript(JURI::base().'components/com_dpcalendar/views/hhlist/tmpl/js/eventhub-partners.js');
    


if (JRequest::getCmd('tmpl', '') == 'component') {
	$document->addStyleSheet(JURI::base().'components/com_dpcalendar/views/event/tmpl/none-responsive.css');
}

JFactory::getLanguage()->load('com_dpcalendar', JPATH_ADMINISTRATOR.'/components/com_dpcalendar');

$params = $this->item->params;


// $content = ('{{#events}}
/*$content = $params->get('event_output', '{{#events}}
<div id="dpcal-event-container" class="dp-container">
{{#pluginsBefore}} {{{.}}} {{/pluginsBefore}}
{{#canEdit}}<div class="pull-left event-button">{{{editButton}}}</div>{{/canEdit}}
{{#canDelete}}<div class="pull-left event-button">{{{deleteButton}}}</div>{{/canDelete}}
<div class="pull-left event-button">{{{shareTwitter}}}</div>
<div class="pull-left event-button">{{{shareLike}}}</div>
<div class="pull-left event-button">{{{shareGoogle}}}</div>
<div class="clearfix"></div>
<h2>{{eventLabel}}</h2>
<div class="row-fluid">
	<div class="span7">
		<div class="row-fluid">
			<div class="span3 event-label">{{titleLabel}}: </div>
			<div class="span9">{{title}}</div>
		</div>
		<div class="row-fluid">
			<div class="span3 event-label">{{calendarNameLabel}}: </div>
			<div class="span9">{{calendarName}}</div>
		</div>
		<div class="row-fluid">
			<div class="span3 event-label">{{dateLabel}}: </div>
			<div class="span9">{{date}}</div>
		</div>
		<div class="row-fluid">
			<div class="span3 event-label">{{locationLabel}}: </div>
			<div class="span9">{{#location}}<div class="dp-location" data-latitude="{{latitude}}" data-longitude="{{longitude}}" data-title="{{title}}"><a href="http://maps.google.com/?q={{full}}" target="_blank">{{title}}</a></div><br/>{{/location}}</div>
		</div>
		<!--
		<div class="row-fluid">
			<div class="span3 event-label">{{urlLabel}}: </div>
			<div class="span9"><a href="{{url}}" target="_blank">{{url}}</a></div>
		</div>
		-->
		<div class="row-fluid">
			<div class="span3 event-label">{{authorLabel}}: </div>
			<div class="span9">{{author}}<br/>{{{avatar}}}</div>
		</div>
		<div class="row-fluid">
			<div class="span3 event-label">{{copyLabel}}: </div>
			<div class="span9"><a target="_blank" href="{{copyGoogleUrl}}">{{copyGoogleLabel}}</a></div>
		</div>
		<div class="row-fluid">
			<div class="span3 event-label"></div>
			<div class="span9"><a target="_blank" href="{{copyOutlookUrl}}">{{copyOutlookLabel}}</a></div>
		</div>
	</div>
	<div class="span5"><div id="dp-event-details-map" class="pull-right dpcalendar-fixed-map" data-zoom="4"></div></div>
</div>
{{#description}}
<h2>{{descriptionLabel}}</h2>
{{{description}}}
{{/description}}
{{#pluginsAfter}} {{{.}}} {{/pluginsAfter}}
{{#shareComment}}
<h2>{{commentsLabel}}</h2>
{{{shareComment}}}
{{/shareComment}}
</div>
{{/events}}
{{^events}}
{{emptyText}}
{{/events}}');*/

$content='{{#events}}
<div id="dpcal-event-container" class="dp-container">
{{#pluginsBefore}} {{{.}}} {{/pluginsBefore}}
{{#canEdit}}<div class="pull-left event-button">{{{editButton}}}</div>{{/canEdit}}
{{#canDelete}}<div class="pull-left event-button">{{{deleteButton}}}</div>{{/canDelete}}
<!--<div class="pull-left event-button">{{{shareTwitter}}}</div>
<div class="pull-left event-button">{{{shareLike}}}</div>
<div class="pull-left event-button">{{{shareGoogle}}}</div>-->
<div class="clearfix"></div>

<div style="color: #696969;">
		
	<div>	
		<h1 id="event-title" style="font-size: 24px;line-height:1em;font-weight:bold;">{{title}}
    		<!--<em class="muted" style="display:block;font-size:14px">Posted in {{calendarName}} calendar</em>-->
		</h1>
		<div class="row-fluid">
		<div class="span12">
			<div class="row-fluid">
				<!--<div class="span2 event-label">{{dateLabel}}: </div>-->
				<div class="span10" style="font-size: 15px;">{{date}}</div>
			</div>
			<div class="row-fluid" style="margin-bottom: 5px;">
				<!--<div class="span2 event-label">{{locationLabel}}: </div>-->
				<div class="span10">{{#location}}<div class="dp-location" data-latitude="{{latitude}}" data-longitude="{{longitude}}" data-title="{{title}}">
					<a href="http://maps.google.com/?q={{full}}" target="_blank" style="font-size: 15px;color: #696969;">{{title}}</a></div>{{/location}}</div>
			</div>

			<div class="cal-icon-container-box" style="background:{{calIconImage}};" title="{{calendarName}}"><a href="{{calendarURL}}">{{calFirstLetter}}</a></div>
			<a href="{{calendarURL}}" style="display:inline-block;margin-right:10px; color:{{calIconImage}};font-size: 15px;">{{calendarName}} Calendar</a>
			<div class="row-fluid" id="share_control">
				<div class="js-share-bar horizontal-share-buttons upper-share-buttons c bf_dom">
					<div class="fb_share" style="display: block;">
						<a class="bf_dom shareBtn square" href="javascript:;">
							<i class="fb_icon fa"></i>
							<span></span>
						</a>
					</div>
					<div class="email_share" style="display: block;">
						<a class="bf_dom shareBtn square"  href="mailto:demo@service.com">
							<i class="email_icon fa"></i>
							<span></span>
						</a>
					</div>
					<div class="gplus_share" style="display: block;">
						<a class="bf_dom shareBtn square" href="javascript:;">
							<i class="gplus_icon fa"></i>
							<span></span>
						</a>
					</div>
					<div class="tweet_share" style="display: block;">
						<a class="bf_dom shareBtn square" href="javascript:;">
							<i class="twitter_icon fa"></i>
							<span></span>
						</a>
					</div>
					<div class="linkedin_share" style="display: block;">
						<a class="bf_dom shareBtn square" href="javascript:;">
							<i class="li_icon fa"></i>
							<span></span>
						</a>
					</div>
					<div class="clear"></div>
				</div>
			</div>
		</div>
		</div>
	</div>
</div>


{{#description}}
<!--<h3>{{descriptionLabel}}</h3>-->
<div id="event-description" style="clear:both;  margin-top: 16px;">
{{{description}}}
{{/description}}
</div>
<div class="transwrp"></div>
<div class="trnsnxt"><span class="descvewmore">---View More---</span></div>
<div id="map-container"></div>
<!--<span id="hh-show-directions" class="btn btn-mini btn-info" style="display:inline-block;">Get directions?</span>-->
<div id="hh-directions" style="margin-top:5px;display:none;">
  <div class="input-append">
     <input class="span3" id="hh-direction-origin" type="text" placeholder="Enter your location here">
     <button id="hh-get-directions" class="btn" type="button"><i class="icon icon-road" style="background-image:none;"></i></button>
  </div>
  <div id="hh-direction-results" style="display:none;">
     <div id="hh-direction-steps"></div>
  </div>
  <div id="dp-event-details-map" class="dpcalendar-fixed-map" data-zoom="4"></div>
</div>
{{#pluginsAfter}} {{{.}}} {{/pluginsAfter}}
{{#shareComment}}
<!--<h2>{{commentsLabel}}</h2>
{{{shareComment}}}
{{/shareComment}}-->
</div>
{{/events}}
{{^events}}
{{emptyText}}
{{/events}}';

$variables = array();
$variables['shareTwitter'] = JHtml::_('share.twitter', $params);
$variables['shareLike'] = JHtml::_('share.like', $params);
$variables['shareGoogle'] = JHtml::_('share.google', $params);
$variables['shareComment'] = JHtml::_('share.comment', $params, $this->item);

$variables['editButton'] = JHtml::_('icon.edit', $this->item, $params);
$variables['deleteButton'] = JHtml::_('icon.delete', $this->item, $params);

JPluginHelper::importPlugin('dpcalendar');
$dispatcher = JDispatcher::getInstance();
$variables['pluginsBefore'] = $dispatcher->trigger('onEventBeforeDisplay', array(&$this->item,  &$content));
$variables['pluginsAfter'] = $dispatcher->trigger('onEventAfterDisplay', array(&$this->item,  &$content));

echo DPCalendarHelper::renderEvents(array($this->item), $content, JFactory::getApplication()->getParams(), $variables);

echo '<div class="fs-search"><div class="input-container"><input id="search-input" type="text" placeholder="Search for your event..."/><i class="icon-search"></i></div><i class="icon-remove"></i>
		<div class="more-container"><input id="location-input" type="text" placeholder="Location"/>
			<select id="distance-input">
  				<option value="5">5 miles</option>
  				<option value="10">10 miles</option>
 	 			<option value="15">15 miles</option>
 			 	<option value="20">20 miles</option>
 			 	<option value="30">30 miles</option>
			</select>
		<input id="date-input" type="text" data-name="data-start" /></div></div>';

list($usec,$sec) =explode(' ',microtime()); 

echo '<input id="filter-search" class="formElements" type="hidden" name="keywords" value="" />
<input id="filter-radius" class="formElements" type="hidden" name="radius" value="30" />
<input id="filter-location" class="formElements" type="hidden" name="my_location" value="" />
<input id="event-limit" class="formElements" type="hidden" name="limit" value="20" />
<input id="date-start" class="formElements" type="hidden" name="start_date" value="'.$sec.'" />
<input type="hidden" class="formElements" name="limitstart" value="" />';
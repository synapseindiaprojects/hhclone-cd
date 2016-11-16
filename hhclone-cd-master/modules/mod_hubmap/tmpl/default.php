<?php // no direct access
defined( '_JEXEC' ) or die( 'Restricted access' ); 
$doc = JFactory::getDocument();
$doc->addScript('//cdnjs.cloudflare.com/ajax/libs/jquery/1.9.1/jquery.js');
$doc->addScript('//code.jquery.com/ui/1.10.4/jquery-ui.js');
//$doc->addScript('https://maps.googleapis.com/maps/api/js?sensor=false&amp;language=en');
$doc->addScript('https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&libraries=places');
//$doc->addScript('http://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerclusterer/src/markerclusterer.js');
$doc->addScript(JURI::root() . 'modules/mod_hubmap/tmpl/js/mapData.js?v=1.1');
//$doc->addScript(JURI::root() . 'modules/mod_hubmap/tmpl/js/pace.js');
$doc->addStyleSheet(JURI::root() .'modules/mod_hubmap/tmpl/css/mapStyle.css');
//$doc->addStyleSheet(JURI::root() .'modules/mod_hubmap/tmpl/css/pace-style.css');
$doc->addStyleSheet(JURI::root() .'modules/mod_hubmap/tmpl/css/mediaqueries.css');
$doc->addStyleSheet('//code.jquery.com/ui/1.10.4/themes/smoothness/jquery-ui.css');
?>
<style>
.rt-container!important {
    margin: -355px auto 0;
    position: relative;
    width: 1200px;
}
</style>
<div class="ui-widget">
	<input id="pac-input" class="controls"  placeholder="Search by town or zip code">
</div>

<h2 id="top-header">Select A Hub Near You</h2>
<div id="map_canvas" class="main-map"></div>

<div id="sideBarMenu" >
    <a id ="sideBarButton" href="#" class="icon icon-chevron-right"></a>
    <div>
        <ul id="hubMenu" style="left:-385px;">
            
        </ul>
    </div>
</div>

<div id="mLocation">
	<a href="#" class="myLocation">Get My Location</a>
</div>
<?php

 
// no direct access
defined( '_JEXEC' ) or die( 'Restricted access' );
 JLoader::import('modules.mod_hubmap.helper', JPATH_SITE);

 
require JModuleHelper::getLayoutPath('mod_hubmap',$params->get('layout','default'));
?>
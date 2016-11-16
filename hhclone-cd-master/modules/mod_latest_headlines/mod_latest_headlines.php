<?php

defined('_JEXEC') or die ('Direct Access to this location is not allowed');
JLoader::import('components.com_api.helpers.utils', JPATH_SITE);
JLoader::import('components.com_hamlethub.helpers.helper', JPATH_SITE);
JLoader::import('modules.mod_latest_headlines.helper', JPATH_SITE);

require JModuleHelper::getLayoutPath('mod_latest_headlines',$params->get('layout','default'));

?>

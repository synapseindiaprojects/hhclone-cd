<?php
/**
 * @package		DPCalendar
 * @author		Digital Peak http://www.digital-peak.com
 * @copyright	Copyright (C) 2012 - 2013 Digital Peak. All rights reserved.
 * @license		http://www.gnu.org/licenses/gpl.html GNU/GPL
 */

defined('_JEXEC') or die();

JLoader::import('joomla.application.component.view');

class DPCalendarViewEvent extends JViewLegacy {

	protected $state;
	protected $item;

	public function display($tpl = null) {
		$app = JFactory::getApplication();
		$params = $app->getParams();
		$user = JFactory::getUser();

		// Get some data from the models
		$state = $this->get('State');
		$item = $this->get('Item');
		$item->category_published = (int)$item->category_published;
		if(empty($item->category_published) && !$user->authorise('core.edit','com_dpcalendar.category'.(int)$item->catid)){
			JError::raiseError(404, 'We are sorry, this event is no longer available.');
			return false;
		}
		if (count($errors = $this->get('Errors'))){
			JError::raiseWarning(500, implode("\n", $errors));
			return false;
		}

		if ($item == null) {
			JError::raiseWarning(403, JText::_('COM_DPCALENDAR_ERROR_EVENT_NOT_FOUND'));
			return false;
		}

		// Add router helpers.
		$item->slug = $item->alias ? ($item->id . ':' . $item->alias) : $item->id;
		$item->catslug = $item->category_alias ? ($item->catid . ':' . $item->category_alias) : $item->catid;
		$item->parent_slug = $item->category_alias ? ($item->parent_id . ':' . $item->parent_alias) : $item->parent_id;

		$params = $state->get('params');

		// Merge event params. If this is event view, menu params override event params
		// Otherwise, event params override menu item params
		$active	= $app->getMenu()->getActive();
		$temp	= clone ($params);

		// Check to see which parameters should take priority
		if ($active) {
			$currentLink = $active->link;
			// If the current view is the active item and an event view for this article, then the menu item params take priority
			if (strpos($currentLink, 'view=event') && (strpos($currentLink, '&id='.(string) $item->id))) {
				// $item->params are the event params, $temp are the menu item params
				// Merge so that the menu item params take priority
				$item->params->merge($temp);
				// Load layout from active query (in case it is an alternative menu item)
				if (isset($active->query['layout'])) {
					$this->setLayout($active->query['layout']);
				}
			}
			else {
				// Current view is not a single event, so the event params take priority here
				// Merge the menu item params with the event params so that the event params take priority
				$temp->merge($item->params);
				$item->params = $temp;

				// Check for alternative layouts (since we are not in a single-event menu item)
				// Single-event menu item layout takes priority over alt layout for an event
				if ($layout = $item->params->get('event_layout')) {
					$this->setLayout($layout);
				}
			}
		}
		else {
			// Merge so that event params take priority
			$temp->merge($item->params);
			$item->params = $temp;
			// Check for alternative layouts (since we are not in a single-event menu item)
			// Single-event menu item layout takes priority over alt layout for an event
			if ($layout = $item->params->get('article_layout')) {
				$this->setLayout($layout);
			}
		}

		// Check the access to the event
		$levels = $user->getAuthorisedViewLevels();

		if (!in_array($item->access, $levels) or ((in_array($item->access, $levels) and (!in_array($item->category_access, $levels))))) {
			JError::raiseWarning(403, JText::_('JERROR_ALERTNOAUTHOR'));
			return;
		}
		$this->assignRef('params'  , $params  );
		$this->assignRef('state', $state);
		$this->assignRef('item', $item);

		if ($this->getLayout() == 'edit') {
			$this->_displayEdit($tpl);
			return;
		}
		$this->pageclass_sfx = htmlspecialchars($this->item->params->get('pageclass_sfx'));

		$model = $this->getModel();
		$model->hit();

		$this->_prepareDocument();

		parent::display($tpl);
	}

	protected function _prepareDocument(){
		$app		= JFactory::getApplication();
		$menus		= $app->getMenu();
		$pathway	= $app->getPathway();
		$title		= null;

		// Because the application sets a default page title,
		// we need to get it from the menu item itself
		$menu = $menus->getActive();
		if ($menu) {
			$this->params->def('page_heading', $this->params->get('page_title', $menu->title));
		}
		else {
			$this->params->def('page_heading', JText::_('COM_DPCALENDAR_DEFAULT_PAGE_TITLE'));
		}

		$title = $this->params->get('page_title', '');

		$id = (int) @$menu->query['id'];

		// if the menu item does not concern this newsfeed
		if ($menu && 
			((!empty($menu->query['option']) && $menu->query['option'] != 'com_dpcalendar') || 
				(!empty($menu->query['option']) && $menu->query['view'] != 'event' ) || 
				$id != $this->item->id))
		{
			// If this is not a single event menu item, set the page title to the event title
			if ($this->item->title) {
				$title = $this->item->title;
			}

			$path = array(array('title' => $this->item->title, 'link' => ''));
			$category = DPCalendarHelper::getCalendar($this->item->catid);
			while ($category != null && 
				((!empty($menu->query['option']) && $menu->query['option'] != 'com_dpcalendar') || 
					(!empty($menu->query['view']) && $menu->query['view'] == 'event' ) || 
					$id != $category->id) && $category->id > 1)
			{
				$path[] = array('title' => $category->title, 'link' => DPCalendarHelper::getCalendarRoute($category->id));
				$category = $category->getParent();
			}
			$path = array_reverse($path);
			foreach($path as $item)
			{
				$pathway->addItem($item['title'], $item['link']);
			}
		}

		if (empty($title)) {
			$title = $app->getCfg('sitename');
		}
		elseif ($app->getCfg('sitename_pagetitles', 0) == 1) {
			$title = JText::sprintf('JPAGETITLE', $app->getCfg('sitename'), $title);
		}
		elseif ($app->getCfg('sitename_pagetitles', 0) == 2) {
			$title = JText::sprintf('JPAGETITLE', $title, $app->getCfg('sitename'));
		}
		if (empty($title)) {
			$title = $this->item->name;
		}
		$this->document->setTitle($title);

		if ($this->item->metadesc)
		{
			$this->document->setDescription($this->item->metadesc);
		}
		elseif (!$this->item->metadesc && $this->params->get('menu-meta_description'))
		{
			$this->document->setDescription($this->params->get('menu-meta_description'));
		}

		if ($this->item->metakey)
		{
			$this->document->setMetadata('keywords', $this->item->metakey);
		}
		elseif (!$this->item->metakey && $this->params->get('menu-meta_keywords'))
		{
			$this->document->setMetadata('keywords', $this->params->get('menu-meta_keywords'));
		}

		if ($this->params->get('robots'))
		{
			$this->document->setMetadata('robots', $this->params->get('robots'));
		}

		if ($app->getCfg('MetaAuthor') == '1') {
			$this->document->setMetaData('author', $this->item->author);
		}

		$mdata = $this->item->metadata->toArray();
		foreach ($mdata as $k => $v)
		{
			if ($v) {
				$this->document->setMetadata($k, $v);
			}
		}
	}
}
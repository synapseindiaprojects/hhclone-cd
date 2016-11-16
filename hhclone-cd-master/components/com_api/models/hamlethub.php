<?php
/**
 * API Model for Hamlethub features.
 * Date: 01/16/2014
 * Author: Jose P.
 */
defined('_JEXEC') or die();

JLoader::import('joomla.application.component.model');

class APIModelHamlethub extends JModel{
    private $fields = array(
           'mighty_id','domain',
           'hub_type', 'hub_id',
           'hub_name', 'town_name',
           'hub_state_code', 'hub_state','distance'
        );
    public function getAllHubs(){
        $db = JFactory::getDbo();
        $query = $db->getQuery(true);
        $query
                ->select(''
                        . 'm.id as mighty_id, m.domain as domain,'
                        . 'type.name as hub_type, hub.id as hub_id,'
                        . 'hub.name AS hub_name,town.name as town_name,town.latitude AS latitude, town.longitude AS longitude,'
                        . 'county.name as hub_county,state.code as hub_state_code, state.name as hub_state')
                ->from('#__mightysites AS m')
                ->join('INNER', 'hamlethub.hhd_hub AS hub ON (m.id = hub.mightysites_id)')
                ->join('INNER','hamlethub.hhd_hub_town AS town ON (hub.town_id = town.id)')
                ->join('LEFT', 'hamlethub.hhd_hub_type AS type ON(hub.type_id = type.id)')
                ->join('LEFT', 'hamlethub.hhd_hub_county as county ON (town.hub_county_id = county.id)')
                ->join('LEFT','hamlethub.hhd_hub_state AS state ON (town.hub_state_id = state.id)')
                ->where('hub.status = 1');
        if($this->getState('filter.hub_state')){
            $query->where('state.name ='. $db->quote($this->getState('filter.hub_state')));
        }
        if($this->getState('filter.hub_state_code')){
            $query->where('state.code ='. $db->quote($this->getState('filter.hub_state_code')));
        }
        if($this->getState('filter.latitudeMin') && $this->getState('filter.longitudeMin') && 
            $this->getState('filter.latitudeMax') && $this->getState('filter.longitudeMax') &&
            $this->getState('filter.radius')){
            $query->where('town.longitude > ' . $this->getState('filter.longitudeMin') . " AND
                       town.longitude < " . $this->getState('filter.longitudeMax') . " AND
                               town.latitude > " . $this->getState('filter.latitudeMin') . " AND
                       town.latitude < " . $this->getState('filter.latitudeMax'));
                if($this->getState('filter.thMeridianLonMin')){
                    $query->where('town.longitude > ' . $this->getState('filter.thMeridianLonMin') . " AND
                       town.longitude < " . $this->getState('filter.thMeridianLonMax') . " AND
                               town.latitude > " . $this->getState('filter.latitudeMin') . " AND
                       town.latitude < " . $this->getState('filter.latitudeMax'));
                }
            //double check bounds, for more accurate results (in radians)
               $locLat = deg2rad($this->getState('filter.locationLat'));
                $locLong = deg2rad($this->getState('filter.locationLong'));
                $angularRadius = $this->getState('filter.radius') / 3959; //in miles
                $query->where('ACOS(SIN('.$locLat.') * SIN(RADIANS(town.latitude)) + COS('.$locLat.')'
                        . '* COS(RADIANS(town.latitude)) * COS(RADIANS(town.longitude) - ('.$locLong.') ) ) <= '.$angularRadius);

            /*$query->where('town.latitude > '. $db->quote($this->getState('filter.minLatitude')));
            $query->where('town.longitude > '. $db->quote($this->getState('filter.minLongitude')));
            $query->where('town.latitude < '. $db->quote($this->getState('filter.maxLatitude')));
            $query->where('town.longitude < '. $db->quote($this->getState('filter.maxLongitude')));*/
            //we'll also need a distance field
            $distanceSelect = '
                        3961 * 2 * 
                        ASIN(SQRT(POWER(SIN((' . $db->quote($this->getState('filter.locationLat')) . ' - town.latitude) * pi()/180/2),2) +
                                  COS(' . $db->quote($this->getState('filter.locationLat')) . ' * pi()/180) * 
                                  COS(town.latitude * pi()/180) *
                                  POWER(SIN((' . $db->quote($this->getState('filter.locationLong')) . ' - town.longitude) * pi()/180/2), 2)
                                  )) AS distance';
            $query->select($distanceSelect);
            $query->having('distance <= '. $this->getState('filter.radius'));
        }
        if($this->getState('filter.authorized')){
            $user = JFactory::getUser();
            $query->where('hub.group_id IN ('.implode(',', $user->groups).')');
        }
        if($this->getState('filter.exclude_hub')){
            $hubId = $this->getState('filter.exclude_hub');
            if(is_numeric($hubId)){
                $query->where('hub.id != '.(int)$hubId);
            }
            elseif(strtolower($hubId) === "true"){
                $hubId = HHFactory::getHHConfig()->get('hamletHubId');
                $query->where('hub.id != '.(int)$hubId);
            }elseif(is_array($hubId)){
                JArrayHelper::toInteger($hubId);
                $query->where('hub.id NOt IN ( '.implode(',', $hubId). ')');
            }elseif(strpos($hubId, ',')!== false){
                $hubId = explode(',', $hubId);
                JArrayHelper::toInteger($hubId);
                $query->where('hub.id NOT IN ( '.implode(',', $hubId).')');
            }
        }
        $order = $this->getState('list.order', 'hub_name');
        if(strpos($order, ',') !== false || is_array($order)){
            $order = explode(',', $order);
            foreach($order as &$column){
                if (!in_array($column, $this->fields))
                    $column = 'hub_name';
            }
            $order = implode(',', $order);
        }
        else if(!in_array($order, $this->fields)){
            $order = 'hub_name';
        }
        $query->order($order.' '. $this->getState('list.direction', 'asc'));
        $db->setQuery($query);
        $results = $db->loadObjectList();
        return $results;
    }
    public function getHubTypes(){
        $db = JFactory::getDbo();
        $query = $db->getQuery(true);
        $query
                ->select(''
                        . 'm.id as mighty_id, m.domain as domain,'
                        . 'type.id as hub_type_id, type.name as hub_type_name')
                ->from('#__mightysites AS m')
                ->join('INNER', 'hamlethub.hhd_hub_type AS type ON (m.id = type.mightysites_id)');
        if($this->getState('filter.hub_type_name')){
            $query->where('type.name ='. $db->quote($this->getState('filter.hub_type_name')));
        }
        $order = $this->getState('list.order', 'hub_type_name');
        if(!in_array($order, array('hub_type_id','hub_type_name', 'domain'))){
            $order = 'hub_type_name';
        }
        $query->order($order.' '. $this->getState('list.direction', 'asc'));
        $db->setQuery($query);
        $results = $db->loadObjectList();
        return $results;
    }
    public function getTowns() {
        $db = JFactory::getDbo();
        $query = $db->getQuery(true);
        $query
                ->select('town.*')
                ->from('hamlethub.hhd_hub_town as town');
        //filter by name
        if ($this->getState('filter.hub_town')) {
            $query->where(
                    APIUtils::getSearchWhereCondition($db, $this->getState('filter.hub_town'), array('id' => 'town.id','name' => 'town.name'), "=")
            );
        }
        //filter by county
        if($this->getState('filter.hub_county')){
            $query->join('INNER', 'hamlethub.hhd_hub_county AS county ON (town.hub_county_id = county.id)');
            $query->where(
                    APIUtils::getSearchWhereCondition($db, $this->getState('filter.hub_county'), array('id' => 'county.id','name' => 'county.name'), "=")
            );
        }
        //filter by state
        if($this->getState('filter.hub_state')){
            $query->join('INNER', 'hamlethub.hhd_hub_state AS state ON (town.hub_state_id = state.id)');
            $query->where(
                    APIUtils::getSearchWhereCondition($db, $this->getState('filter.hub_state'), array('id' => 'state.id','name' => 'state.name'), "=")
            );
        }
        $order = $this->getState('list.order', 'town.name');
        $query->order($order.' '. $this->getState('list.direction', 'asc'));
        $db->setQuery($query);
        return $db->loadObjectList();
    }

    public function getCounties(){
        $db = JFactory::getDbo();
        $query = $db->getQuery(true);
        $query
                ->select('county.*')
                ->from('hamlethub.hhd_hub_county as county');
        //filter by name
        if ($this->getState('filter.hub_county')) {
            $query->where(
                    APIUtils::getSearchWhereCondition($db, $this->getState('filter.hub_county'), array('id' => 'county.id','name' => 'county.name'), "=")
            );
        }
        //filter by state
        if($this->getState('filter.hub_state')){
            $query->join('INNER', 'hamlethub.hhd_hub_state AS state ON (town.hub_state_id = state.id)');
            $query->where(
                    APIUtils::getSearchWhereCondition($db, $this->getState('filter.hub_state'), array('id' => 'state.id','name' => 'state.name'), "=")
            );
        }
        $order = $this->getState('list.order', 'county.name');
        $query->order($order.' '. $this->getState('list.direction', 'asc'));
        $db->setQuery($query);
        return $db->loadObjectList();
    }
    public function getStates(){
        $db = JFactory::getDbo();
        $query = $db->getQuery(true);
        $query
                ->select('state.*')
                ->from('hamlethub.hhd_hub_state as state');
        //filter by name
        if ($this->getState('filter.hub_state')) {
            $query->where(
                    APIUtils::getSearchWhereCondition($db, $this->getState('filter.hub_state'), array('id' => 'state.id','name' => 'state.name', 'sec_name'=>'state.code'), "=")
            );
        }
        $order = $this->getState('list.order', 'state.name');
        $query->order($order.' '. $this->getState('list.direction', 'asc'));
        $db->setQuery($query);
        return $db->loadObjectList();
    }
    protected function populateState() {
        $data = array(
          'list.order' => JRequest::getVar('order_by', null),
          'list.direction' => JRequest::getVar('order_direction', 'asc'),
          'filter.radius' => JRequest::getInt('radius', null),
          'filter.location' => JRequest::getVar('location', array()),
          'filter.hub_town' => JRequest::getVar('hub_town', null),
          'filter.hub_county' => JRequest::getVar('hub_county', null),
          'filter.hub_state' => JRequest::getVar('hub_state',null),
          'filter.hub_state_code' => JRequest::getVar('hub_state_code',null),
          'filter.hub_type_name' => JRequest::getVar('hub_type_name', null),
          'filter.authorized' => JRequest::getBool('authorized', false),
          'filter.exclude_hub' => JRequest::getVar('exclude_hub', false),          
          'list.direction' => strtolower(JRequest::getVar('order_direction', 'asc'))
        );
        if(!empty($data['filter.radius']) && !empty($data['filter.location']) && is_array($data['filter.location'])){
            $coordinates = APIUtils::getAccuMaxMinCoordinates($data['filter.location'], $data['filter.radius']);
            if(isset($coordinates)){
                $this->setState('filter.latitudeMin', rad2deg($coordinates->latitudeMin));
                $this->setState('filter.longitudeMin', rad2deg($coordinates->longitudeMin));
                $this->setState('filter.latitudeMax', rad2deg($coordinates->latitudeMax));
                $this->setState('filter.longitudeMax', rad2deg($coordinates->longitudeMax));
                $this->setState('filter.locationLat', $data['filter.location']['latitude']);
                $this->setState('filter.locationLong', $data['filter.location']['longitude']);
                if(isset($coordinates->thMeridian)){
                    $this->setState('filter.thMeridianLonMin', rad2deg($coordinates->thMeridianLongMin));
                    $this->setState('filter.thMeridianLonMax',  rad2deg($coordinates->thMeridianLongMax));
                }
            }
        }
        if(!in_array($data['list.direction'], array('asc','desc'))){
            $data['list.direction'] = 'asc';
        }
        foreach ($data AS $key => $item) {
            $this->setState($key, $item);
        }
        parent::populateState();
    }
}


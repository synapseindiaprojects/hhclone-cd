<?php

defined('_JEXEC') or die;

class LHeadlinesHelper{
    public static function getData($params){
        $optionSelected = $params->get('siteId');
        $optionSelected = explode(',', $optionSelected);
        $mightyId = (int)$optionSelected[0];
        $type = $optionSelected[1];
        $db = JFactory::getDbo();
        $query = $db->getQuery(true);
        $query
            ->select('db, dbprefix')
            ->from('hamlethub.hhd_mightysites')
            ->where('id = '. $mightyId);
        $db->setQuery($query);
        $data = $db->loadObject();
        $table = "#__content";
        if($type === "hub"){
            $table = $data->db. "." . $data->dbprefix . "content";
        }elseif ($type === "type") {
            $table = $data->db. "." . $data->dbprefix . HHelper::getLatestArticlesTableName();
        }

        $query->clear();
        $query
           ->select('a.*')
           ->from($table. ' as a');

        $nullDate = $db->Quote($db->getNullDate());
        $nowDate = $db->Quote(JFactory::getDate()->toSql());

        $query->where('(a.publish_up = ' . $nullDate . ' OR a.publish_up <= ' . $nowDate . ')');
        $query->where('(a.publish_down = ' . $nullDate . ' OR a.publish_down >= ' . $nowDate . ')');
        $query->order('publish_up DESC');
        $db->setQuery($query, 0, $params->get('maxLimit', 6));

        return $db->loadObjectList();
    }
    public static function getParsedData($params){
        $items = self::getData($params);
        foreach ($items AS &$i) {
            $i->trimmed_title = APIUtils::trimTextByChar($i->title, 40);
            if(isset($i->category_route))
                $i->link = self::parseArticleLink($i);
            $images = APIUtils::getImagesFromHTML($i->introtext);
            $i->article_image = APIUtils::getCachedImage($images[0], true, 275, true);
        }
        return $items;
    }
    public static function parseArticleLink($i){
        return JURI::base() . $i->category_route . '/' . $i->id . '-' . $i->alias;
    }
}
/**
 * Get the source where to get articles from. There are latest articles per type.
 * @param type $db
 * @return type
 */
function getSource(&$db,$siteId) {

    //$query = $db->getQuery(true);
    /**
     * Get the db info of the site Id specified. Check the hub type table
     * Check the hub type table to see if the site is a hub type.
     * If not, then it is a regular hub.
     */
    /*$query
            ->select('m.db, m.dbprefix, t.mightysite_id')
            ->from($db->quoteName(HHelper::getMightySitesSource() . ' AS m'))
            ->join('LEFT', HHelper::getMightyDb(). '.' .
                    HHelper::getMightyDbprefix(). 
                    'hub_type AS t ON (m.id = t.mightysite_id)')
            ->where('id = ' . $siteId . '');

    $db->setQuery($query);

    $source = $db->loadObjectList();
    return $source;*/
}
/*
function getData(&$db,$siteId,$maxLimit = 5) {
    //get the source
    $source = getSource($db,$siteId);
    //if a mightysite id is found then it is a hub type
    if (isset($source[0]->mightysite_id) && !empty($source[0]->migthysite_id))
        $table = HHelper::getLatestArticlesTableName();
    //else it's a hub
    else
        $table = "content";
    
    //get query object
    $query = $db->setQuery("")->getQuery(true);

    //build query to obtain articles from latest articles table
    $query
            ->select('*')
            ->from('' . $source[0]->db . '.' . $source[0]->dbprefix . $table . '')
            ->order('publish_up DESC');

    $db->setQuery($query, 0, $maxLimit);

    $data = $db->loadObjectList();

    //get image handler
    $jaimage = JAImage::getInstance();
    //get image options
    $w = (int) $params->get('width', 50);
    $h = (int) $params->get('height', 50);
    //handle any images found
    $jaimage->handleImages($data, $w, $h);
    //return the data
    return $data;
}
*/
?>


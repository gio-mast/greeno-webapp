<?php

defined('_WSRV') or die;

require_once "inc/costants.php";

class DataFile {

	private $_path;
	private $_lastModified;


	function __construct($area, $month)
	{
		$this->_path = DATA_PATH.'/'.$area.'/'.$month.'.dat';

		$this->_lastModified = @filemtime($this->_path);
	}


	public function getLastModified() {	return $this->_lastModified; }
	public function getPath() {	return $this->_path; }


	public static function GetAreas()
	{
		$retFolders = array();

		foreach (glob(DATA_PATH.'/*', GLOB_ONLYDIR) as $dirPath)
		{
			$dirName = basename($dirPath);
			if($dirName[0] != '.') // skip hidden and special directories
			{
				array_push($retFolders, $dirName);
			}
		}

		return $retFolders;
	}


	public static function GetMonths($dataFolder)
	{
		$ret_files = array();

		$files = glob($dataFolder."/??????.???"); // glob returns file paths alphabetically sorted
		$files = preg_grep("#/\d{6}\.dat$#i", $files); //grep valid filestamp only

		foreach ($files as $f) {
			$f = substr(basename($f), 0, -4);
			$month = intval(substr($f, 4));
			if($month >= 1 && $month <= 12)
			{
				array_push($ret_files, $f);
			}
		}

		return $ret_files;
	}


	public static function GetAllAvailable()
	{
		$tree = array();

		$areas = self::GetAreas();

		if(count($areas) == 1)
		{
			// hide area name, if there is only one
			array_push($tree, self::GetMonths(DATA_PATH.'/'.$areas[0]));
		}
		else
		{
			foreach ($areas as $area) {
				$tree[$area] = self::GetMonths(DATA_PATH.'/'.$area);
			}
		}

		return $tree;
	}


}

?>
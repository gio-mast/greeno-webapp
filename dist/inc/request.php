<?php

defined('_WSRV') or die;


require_once "inc/costants.php";
require_once "inc/errors.php";
require_once "inc/data_file.php";


class Request
{
	public $type;
	public $area;
	public $month;
	public $raw;

	private $_dataFile;
	private $_multipleAreas;


	public static function FromInputs($useDefaults = TRUE)
	{
		$availableAreas = DataFile::GetAreas();

		$multipleAreas = count($availableAreas) > 1;

		$area = filter_input(INPUT_GET, 'area');
		$month = filter_input(INPUT_GET, 'month');
		$type = filter_input(INPUT_GET, 'type');
		$raw = filter_input(INPUT_GET, 'raw', FILTER_VALIDATE_BOOLEAN);


		// preliminary checks
		if($multipleAreas && !isset($area) && (isset($month) || !$useDefaults))
		{
			throw new RequestException("area is missing", 400, "area");
		}
		
		if(!$useDefaults)
		{
			if(!isset($month)){
				throw new RequestException("month is missing", 400, "month");
			}
			if(!isset($type)){
				throw new RequestException("type is missing", 400, "type");
			}
		}


		$retObj = new Request();

		//  **** AREA ****
		if(!isset($area))
		{
			// get the first available folder in aphabetic order
			if(count($availableAreas) > 0)
			{
				$area = $availableAreas[0];
			}
			else
			{
				throw new RequestException("There are no available data", 404);
			}
		}
		else if(!$multipleAreas || ($multipleAreas && (preg_match('#^[^\.][^\\\/]+$#', $area) !== 1 || !file_exists(DATA_PATH.'/'.$area))))
		{
			throw new RequestException("The specified area was not found", 404, "area");
		}
		$retObj->area = $area;


		$availableMonths = DataFile::GetMonths(DATA_PATH.'/'.$area);


		//  **** MONTH ****
		if(!isset($month))
		{
			if(count($availableMonths) > 0)
			{
				$month = end($availableMonths);
			}
			else
			{
				throw new RequestException("There are no available data", 404);
			}
		}
		else if(preg_match("/^\d{6}$/", $month) !== 1 || !file_exists(DATA_PATH.'/'.$area.'/'.$month.'.dat'))
		{
			throw new RequestException("The specified month was not found", 404, "month");
		}
		$retObj->month = $month;


		//  **** DATA TYPE ****
		if(!isset($type))
		{
			$type = DEFAULT_TYPE;
		}
		else if(!Parser::IsValidType($type))
		{
			throw new RequestException("Wrong data type", 400, "type");
		}
		$retObj->type = $type;


		//  **** FILTER ****
		if(!isset($raw))
		{
			$raw = FALSE;
		}
		$retObj->raw = $raw;


		$retObj->_dataFile = new DataFile($area, $month);

		$retObj->_multipleAreas = $multipleAreas;

		return $retObj;
	}


	public function getDataFile()
	{
		return $this->_dataFile;
	}


	public function isMultipleAreas()
	{
		return $this->_multipleAreas;
	}


	public static function GzipAccepted()
	{
		return isset($_SERVER['HTTP_ACCEPT_ENCODING'])
		     && stripos($_SERVER['HTTP_ACCEPT_ENCODING'], 'gzip') !== FALSE;
	}


	public static function IsRefererAllowed()
	{
		if(isset($_SERVER['HTTP_REFERER'])) {
			$serverName = str_replace('.', '\.', $_SERVER['SERVER_NAME']);
			
			if(preg_match("/^https?:\/\/{$serverName}(?:\/.*)?$/i", $_SERVER['HTTP_REFERER']) == 1) {
				return TRUE;
			}
		}

		return FALSE;
	}


	public static function GetIfNoneMatch()
	{
		if(isset($_SERVER['HTTP_IF_NONE_MATCH'])) {
			return $_SERVER['HTTP_IF_NONE_MATCH'];
		}

		return "";
	}


	public static function GetIfModifiedSince() 
	{
		if(isset($_SERVER['HTTP_IF_MODIFIED_SINCE']))
		{
			$lastModified = @strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']);

			if($lastModified !== FALSE && $lastModified !== -1) {
				return $lastModified;
			}
		}

		return 0;
	}



}

?>
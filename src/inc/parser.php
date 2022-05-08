<?php

defined('_WSRV') or die;

include_once "inc/node.php";
require_once "inc/request.php";
require_once "inc/cache.php";


class Parser {

	private static $Decimals = array(
		'failures' => 0,
		'power' => 0,
		'rssi' => 1,
		'lqi' => 0,
		'temperature' => 2,
		'humidity' => 2,
		'vcc' => 1,
		'gprs' => 1,
		'heaterStat' => 2
	);


	public static function IsValidType($type)
	{
		return isset(self::$Decimals[$type]);
	}


	public static function GetDecimals($type, $raw)
	{
		$decimals = self::$Decimals[$type];

		if($type == 'vcc' && $raw)
		{
			$decimals = 3;
		}

		return $decimals;
	}


	public static function HasRawOption($type)
	{
		return ($type == 'vcc' || $type == 'humidity');
	}

}




class ParsedData {

	const TYPE_NULL         = 0x00;
	const TYPE_GATEWAY_DATA = 0x10;
	const TYPE_TEMP_HUM     = 0x20;

	const GATEWAY_ADDRESS   = 0x01;

	const FmtRecordHeader   = 'N1timestamp/x1/C1saveData/n1dataLength';
	const FmtNodeDataHeader = 'C1address/C1status/C1length';


	private $_timestamps;
	private $_dataTracks;
	private $_nextOffset;
	private $_addressList;
	private $_nodeList;
	private $_labels = NULL;
	private $_decimals = 0;


	public function getTimestamps()  { return $this->_timestamps; }
	public function getData()        { return $this->_dataTracks; }
	public function getNextOffset()  { return $this->_nextOffset; }
	public function getAddressList() { return $this->_addressList; }
	public function getDecimals()    { return $this->_decimals; }


	public function getLabels()
	{
		if (!isset($this->_labels))
		{
			$labels = array();

			foreach ($this->_addressList as $addr)
			{
				if(isset($this->_nodeList[$addr])) {
					array_push($labels, $this->_nodeList[$addr]->getLabel());
				}
				else{
					array_push($labels, strval($addr));
				}
			}

			$this->_labels = $labels;
		}

		return $this->_labels;
	}



	function __construct(Request $request, CacheEntry $cache = NULL)
	{
		$filename = DATA_PATH."/{$request->area}/{$request->month}.dat";

		$handle = @fopen($filename, 'rb');
		if($handle  === FALSE) {
			throw new Exception('Parsing error: cannot open {$filename}');
		}


		$existingData = (isset($cache))? $cache->getLastParsedData() : NULL;

		if(isset($existingData)){
			$timestamps = $existingData['timestamps'];
			$nodeTracks = $existingData['nodes'];
			$offset = $existingData['offset'];
			$recCount = count($timestamps);
		}
		else{
			$timestamps = array();
			$nodeTracks = array();
			$offset = 0;
			$recCount = 0;
		}


		if(@fseek($handle, $offset) != 0)
		{
			if($offset == 0) {
				throw new Exception('Parsing error: unknow error using fseek in {$filename}');
			}

			// Restart from the beginning
			$timestamps = array();
			$nodeTracks = array();
			$offset = 0;
			$recCount = 0;
		}

		$nodeList = self::CreateNodeList($request->area);

		$decimals = Parser::GetDecimals($request->type, $request->raw);
	

		// BEGIN PARSING LOOP
		while (1)
		{
			// read Record Header
			$buf = @fread($handle, 8);
			if(strlen($buf) < 8) {
				break; // exit parsing loop
			}

			$recHeader = unpack(self::FmtRecordHeader, $buf);

			array_push($timestamps, $recHeader['timestamp']);

			$recCount += 1;

			$readBytes = 0;
			while ($readBytes < $recHeader['dataLength'])
			{
				// --- Read Node Header ---
				$buf = fread($handle, 3);
				if(strlen($buf) < 3) {
					break;
				}

				$nodeHeader = unpack(self::FmtNodeDataHeader, $buf);

				$curAddress = $nodeHeader['address'];


				// --- Read Node Payload ---
				$val = NULL;

				if($request->type == 'failures') {
					if($curAddress != self::GATEWAY_ADDRESS) {
						$val = Mote::GetFailures($nodeHeader);
					}
					fseek($handle, $nodeHeader['length'], SEEK_CUR);
				}
				else if ($request->type == 'power') {
					if($curAddress != self::GATEWAY_ADDRESS) {
						$val = Mote::GetPower($nodeHeader);
					}
					fseek($handle, $nodeHeader['length'], SEEK_CUR);
				}
				else if($nodeHeader['length'] > 0) {
					$buf = fread($handle, $nodeHeader['length']);

					$type = unpack('C1', $buf);

					switch ($type[1])
					{
						case self::TYPE_GATEWAY_DATA:
							$val = $nodeList['gateway']->getValue($buf, $request->type, $request->raw);
							break;

						case self::TYPE_TEMP_HUM:
							$mote = isset($nodeList[$curAddress])? $nodeList[$curAddress] : $nodeList['default'];
							$val = $mote->getValue($buf, $request->type, $request->raw, $recHeader['saveData']);
							break;

						default:
							break;
					}
				}


				// Append the value to the current node array
				if(isset($val))
				{
					// If the current node has never been seen before then create a new array
					if(!isset($nodeTracks[$curAddress]))
					{
						$nodeTracks[$curAddress] = array();
					}

					// If the array of the current node is too short then pad with null values
					if(count($nodeTracks[$curAddress]) < $recCount - 1)
					{
						$nodeTracks[$curAddress] = array_pad($nodeTracks[$curAddress], $recCount - 1, NULL);
					}

					array_push($nodeTracks[$curAddress], round($val, $decimals));
				}

				$readBytes += 3 + $nodeHeader['length'];
			}

		}
		// END OF PARSING LOOP


		// Make sure that all node arrays match record count
		foreach ($nodeTracks as $addr => $track)
		{
			$nodeTracks[$addr] = array_pad($track, $recCount, NULL);
		}

		// All tracks must be order by address
		ksort($nodeTracks, SORT_NUMERIC);

		$this->_timestamps  = $timestamps;
		$this->_addressList = array_keys($nodeTracks);
		$this->_dataTracks  = array_values($nodeTracks);
		$this->_nextOffset  = ftell($handle);
		$this->_nodeList    = $nodeList;
		$this->_decimals    = $decimals;

		fclose($handle);
	}


	private static function CreateNodeList($area)
	{
		$retNodeList = array();

		$configFile = "config/nodes.php";
		if(file_exists($configFile))
		{
			include_once $configFile;
		}

		if(isset($NodeConfiguration))
		{
			foreach ($NodeConfiguration as $nodeConf)
			{
				if($nodeConf['area'] != $area) continue;

				if($nodeConf['hardware'] == 'gateway') {
					$gateway = new Gateway($nodeConf['address'], $nodeConf['label']);

					$retNodeList[$nodeConf['address']] = $gateway;
					$retNodeList['gateway'] = $gateway;
				}
				else if($nodeConf['hardware'] == 'mote') {
					$sensorName = $nodeConf['sensor'];
					include_once "inc/sensors/{$sensorName}.php";
					$retNodeList[$nodeConf['address']] = new Mote($nodeConf['address'], $nodeConf['label'], new $sensorName());
				}
			}
		}

		if(!isset($retNodeList['gateway']))
		{
			$retNodeList['gateway'] = new Gateway(1);
		}

		if(isset($defaultSensor)) $defaultSensor = 'Si7021';
		include_once "inc/sensors/{$defaultSensor}.php";
		$retNodeList['default'] = new Mote(NULL, NULL, new $defaultSensor());

		return $retNodeList;
	}


}


?>
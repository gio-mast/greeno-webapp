<?php

defined('_WSRV') or die;


abstract class Node
{
	private $_address;
	private $_label;

	function __construct($address, $label = NULL)
	{
		$this->_address = $address;
		$this->_label = $label;
	}

	public function getAddress()
	{
		return $this->_address;
	}

	public function getLabel()
	{
		if(isset($this->_label)) {
			return $this->_label;
		}

		return strval($this->_address);
	}

	abstract public function getValue($buffer, $type, $raw, $saveData = 0);
}



interface Sensor
{
	public function parse($nodeData, $type, $raw);
}



class Gateway extends Node
{
	const FMT = "x1/n1vcc/n1gprs";

	public function getValue($buffer, $type, $raw, $saveData=0)
	{
		$nodeData = unpack(self::FMT, $buffer);

		if($type == 'vcc')
		{
			$val = $nodeData['vcc']/1000; 

			if(!$raw) {
				$val = ($val - 5) / 4; // Vnom = 9.0V, Vcutoff = 5.0V
				$val = 100 * min(1, max(0, $val));			
			}

			return $val;
		}

		if ($type == 'gprs')
		{
			$val = $nodeData['gprs'];

			if($val >= 32768) {
				$val -= 65536;
			}
			
			if ($val == -255) {
				return NULL;
			}

			return $val;
		}

		return NULL;
	}
}





class Mote extends Node
{
	protected $_sensor;

	const SAVEDATA_SYNC_ONLY    = 0x00;
	const SAVEDATA_LINK_PARAMS  = 0x01;
	const SAVEDATA_NORMAL       = 0x02;
	const SAVEDATA_HEATER_STATS = 0x04;


	function __construct($address, $label, Sensor $sensor)
	{
		parent::__construct($address, $label);
		$this->_sensor = $sensor;
	}


	public static function GetFailures($header)
	{
		return $header['status'] & 0x07;
	}


	public static function GetPower($header)
	{
		return ($header['status'] >> 3) & 0x0F;
	}


	public function getValue($buffer, $type, $raw, $saveData = 0)
	{
		$fmt = "x1";

		if($saveData & self::SAVEDATA_LINK_PARAMS){
			$fmt .= "/c1rssi/C1lqi";
		}

		if($saveData & self::SAVEDATA_NORMAL){
			$fmt .= "/n1humidity/n1temperature/n1vcc";
		}

		if($saveData & self::SAVEDATA_HEATER_STATS){
			$fmt .= "/n1heaterStat";
		}

		$nodeData = unpack($fmt, $buffer);

		
		if($saveData & self::SAVEDATA_LINK_PARAMS)
		{
			if ($type == 'rssi')
			{
				return $nodeData['rssi']/2 - 74;
			}

			if ($type == 'lqi')
			{
				if($nodeData['lqi'] != 0) {
					return $nodeData['lqi'];
				} else {
					return NULL;
				}
			}
		}

		if($saveData & self::SAVEDATA_NORMAL)
		{
			if($type == 'vcc')
			{
				if($nodeData['vcc'] != 0)
				{
					$val = $nodeData['vcc']/1000; 

					if(!$raw) {
						$val = ($val - 1.8) / 1.2; // Vnom = 3.0V, Vcutoff = 1.8V
						$val = 100 * min(1, max(0, $val));
					}

					return $val;
				}
				else {
					return NULL;
				}
			}

			return $this->_sensor->parse($nodeData, $type, $raw);
		}


	}
}



?>
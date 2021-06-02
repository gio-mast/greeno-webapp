<?php

defined('_WSRV') or die;

include_once 'inc/node.php';


class Bme280 implements Sensor
{
	public function parse($nodeData, $type, $raw)
	{
		if(isset($nodeData['humidity']) && isset($nodeData['temperature']))
		{
			if($nodeData['humidity'] == 0 && $nodeData['temperature'] == 0)
			{
				// workaround for the mote firmware bug: lack of N/A value
				return NULL;
			}

			if($type == 'temperature')
			{
				$val = $nodeData['temperature'];
				if($val > 0x7FFF) {
					$val = -(0xFFFF - $val);
				}

				return $val/100;
			}

			if($type == 'humidity')
			{
				$val = $nodeData['humidity']/100;

				if(!$raw && $val > 100){
					return 100;
				}

				return $val;
			}
		}
	}

}


?>
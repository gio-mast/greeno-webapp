<?php

defined('_WSRV') or die;

include_once 'inc/node.php';


class Si7021 implements Sensor
{
	public function parse($nodeData, $type, $raw)
	{
		if($type == 'temperature')
		{
			if(!isset($nodeData['temperature'])) return NULL;

			$val = $nodeData['temperature'];
			if ($val == 0) return NULL;

			return 175.72 * ($val/65536) - 46.85;
		}


		else if($type == 'humidity')
		{
			if(!isset($nodeData['humidity'])) return NULL;

			$val = $nodeData['humidity'];
			if ($val == 0) return NULL;

			$val = 125 * ($val/65536) - 6;

			if(!$raw)
			{
				// use Kandr Smith's calibration, 
				//  https://www.kandrsmith.org/RJS/Misc/Hygrometers/calib_many.html
				if($val <= 0){
					$val = 0;
				} else if ($val > 0 && $val <= 10.5) {
					$val = 0.9524 * $val;
				} else if ($val > 10.5 && $val <= 44.75) {
					$val = 0.8759 * $val + 0.8029;
				} else if ($val > 44.75 && $val <= 87.65) {
					$val = 0.9907 * $val - 4.3338;
				} else if ($val > 87.65 && $val <= 109.65) {
					$val = 0.7955 * $val + 12.7784;
				} else {
					$val = 100;
				}
			}

			return $val;
		}

		else if($type == 'heaterStat')
		{
			if(!isset($nodeData['heaterStat'])) return NULL;

			$val = $nodeData['heaterStat'];
			if ($val == 0) return NULL;

			return 175.72 * ($val/65536) - 46.85;
		}

		return NULL;
	}

}


?>
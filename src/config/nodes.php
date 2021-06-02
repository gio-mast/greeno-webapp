<?php
	defined('_WSRV') or die; 

	$defaultSensor = "Bme280";

	$NodeConfiguration = array(

		array(
				"label"       => "Gateway",
				"area"        => "Montursi",
				"address"     => 1,
				"coordinates" => "16.844018,40.736609",
				"height"      => "3",
				"hardware"    => "gateway"
			),

		array(
				"label"       => "Nodo esterno",
				"area"        => "Montursi",
				"address"     => 6,
				"coordinates" => "16.84462, 40.73696",
				"height"      => "3",
				"hardware"    => "mote",
				"sensor"      => "Bme280"
			),

		array(
				"label"       => "Nodo interno",
				"area"        => "Montursi",
				"address"     => 7,
				"coordinates" => "16.843698,40.736349",
				"height"      => "3",
				"hardware"    => "mote",
				"sensor"      => "Bme280"
			)
	);

?>
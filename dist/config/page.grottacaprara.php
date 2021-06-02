<?php
	defined('_WSRV') or die;
	

	$title = "Monitoraggio ambientale Grottacaprara - Visualizzazione dati";
	$header = "Grottacaprara - Visualizzazione dati";
	$description = "Pagina di visualizzazione dati della rete di monitoraggio installata nella pineta di Grottacaprara, fraz. Montursi - Gioia del Colle (BA)";
	$lang = 'it';

	$mainTypes = array(

		"temperature" => array(
				"name" => "Temperatura",
				"desc" => "Temperatura",
				"unit" => "°C"
			),

		"humidity" => array(
				"name" => "Umidità relativa",
				"desc" => "Umidità relativa",
				"unit" => "%",
				"raw"  => "%"
			),

		"vcc" => array(
				"name" => "Batteria",
				"desc" => "Capacità delle batterie",
				"unit" => "%",
				"raw"  => "mV",
			)
	);

	$otherTypes = array(

		"rssi" => array(
				"name"     => "RSSI",
				"desc"     => "Potenza del segnale radio ricevuto",
				"unit"     => "dBm"
			),

		"lqi" => array(
				"name" => "LQI",
				"desc" => "Link Quality Index"
		),

		"gprs" => array(
				"name"     => "Segnale GPRS",
				"desc"     => "Potenza del segnale GPRS ricevuto",
				"unit"     => "dBm"
		),

		"failures" => array(
				"name" => "Errori CMS",
				"desc" => "Errori di sincronizzazione consecutivi. Questo numero viene incrementato se il nodo non ha risposto entro tre tentativi di sincronizzazione. Viene azzerato se ci riesce in un istante di campionamento successivo. Se i tre tentativi erano a bassa potenza, verranno effettuati altri tre tentativi ad alta potenza. Quando il valore raggiunge (3) si passa automaticamente alla modalità alta potenza. Se il valore raggiunge (7) il nodo viene dichiarato irraggiungibile e non viene più contattato."
		),

		"power" => array(
				"name" => "Alta potenza",
				"desc" => "Un valore maggiore di zero indica che la trasmissione avviene direttamente con un livello di potenza pari +10 dBm, cioè senza tentativi iniziali a bassa potenza. Se il valore RSSI si mantiene sotto una certa soglia impostata il valore scende progressivamente da (8) fino a (0) e a quel punto il livello di potenza torna a 0 dBm."
		),

		"heaterStat" => array(
				"name"     => "Riscaldatore",
				"desc"     => "Temperatura raggiunta quando viene acceso il riscaldatore interno al sensore",
				"unit"     => "°C"
		)
	);


?>
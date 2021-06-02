<?php

	define('_WSRV', 1);

	require_once('config/page.php');	
	require_once('inc/data_file.php');


	function base_url()
	{
		$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

		$slash_pos = strrpos($path, '/');
		if($slash_pos !== FALSE){
			$path = substr($path, 0, $slash_pos);
		}

		return "//{$_SERVER['SERVER_NAME']}{$path}/";
	}


	function printTypeRadios($list, $firstChecked = false)
	{
		$i = 0;
		foreach ($list as $value => $props)
		{
			$name = htmlentities($props['name']);
			$desc = htmlentities($props['desc']);

			$checked = ($firstChecked && $i++ == 0)? ' checked' : '';
			$data_unit = isset($props['unit'])? ' data-unit="'.htmlentities($props['unit']).'"' : '';
			$data_raw = isset($props['raw'])? ' data-raw="'.htmlentities($props['raw']).'"' : '';

			echo "<label class=\"radio-inline\" title=\"{$desc}\">";
			echo    "<input type=\"radio\" name=\"type\" value=\"{$value}\"{$data_unit}{$data_raw}{$checked}>{$name}";
			echo "</label>\n";
		}
	}

	$availableAreas = DataFile::GetAreas();

	$jsonAllAvailableData = json_encode(DataFile::GetAllAvailable(), JSON_HEX_TAG|JSON_HEX_AMP);

?><!DOCTYPE html>
<html lang="<?php echo $lang;?>">
	<head>
		<!-- META -->
		<title><?php echo htmlentities($title); ?></title>
		<meta name="description" content="<?php echo htmlentities($description); ?>">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<meta name="theme-color" content=" #456454">
		<meta http-equiv="content-type" content="text/html; charset=utf-8" >
		<base href="<?php echo base_url(); ?>"> 

		<!-- STYLES -->
		<link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
		<link rel="stylesheet" type="text/css" href="assets/style.v27.css" >

		<link rel="shortcut icon" type="image/png" sizes="192x192" href="assets/android-icon-192x192.png">
		<link rel="shortcut icon" type="image/png" sizes="32x32" href="assets/favicon-32x32.png">
		<link rel="shortcut icon" type="image/png" sizes="96x96" href="assets/favicon-96x96.png">
		<link rel="shortcut icon" type="image/png" sizes="16x16" href="assets/favicon-16x16.png">	

		<!-- SCRIPTS -->
		<script src="assets/plotly-basic-1.52.2.fixed.min.js" crossorigin defer></script>
		<script src="https://cdn.plot.ly/plotly-locale-it-1.52.2.js" crossorigin defer></script>
		<script src="assets/script.v27.js" crossorigin defer></script>
		<script type="application/json" id="data-lists"><?php echo $jsonAllAvailableData; ?></script>
	</head>
	<body>
	<header class="main-header">
		<h1><img class="logo" src="assets/logo.svg" width="96" height="96" alt="" /><?php echo htmlentities($header); ?></h1>
		<div id="progress-bar" class="progress-bar"></div>
	</header>
	
	<div id="main-wrapper">
		<div id="_c0v" class="rsz-container vertical store">
			<div id="top-panels" class="rsz-panel size-3">
				<div id="_c0h" class="rsz-container horizontal store">
					<div id="nav-panel" class="rsz-panel size-3">
						<div class="panel-content">
<form class="form-horizontal" id="data-nav">
	<div class="form-group" id="area-control" <?php if(count($availableAreas) < 2) echo 'hidden'?>>
		<label for="area" class="col-xs-2 control-label">Area</label>
		<div class="col-xs-10">
			<select class="form-control" name="area" id="area"></select>
		</div>
	</div>
	<div class="form-group">
		<label for="month" class="col-xs-2 control-label">Mese</label>
		<div class="col-xs-10">
			<select class="form-control" name="month" id="month"></select>
		</div>
	</div>
	<div class="form-group">
		<label class="col-xs-2 control-label">Dati</label>
		<div class="col-xs-10">
			<fieldset class="form-check" id="data-type">
				<div class="main-types"><?php printTypeRadios($mainTypes, true);?></div>
				<?php printTypeRadios($otherTypes);?>
				<div class="checkbox">
					<label><input type="checkbox" name="raw" value="true">Dati grezzi</label>
				</div>
			</fieldset>
		</div>
	</div>
	<div class="form-group">
		<div class="col-xs-12">
			<div class="btn-container">
				<button type="button" id="refresh" class="btn btn-primary" title="Ricarica i dati selezionati"><i class="glyphicon glyphicon-refresh" aria-hidden="true"></i>&nbsp;Aggiorna</button>
				<button type="button" id="download" class="btn btn-download" title="Scarica un file CSV contenente i dati selezionati"><i class="glyphicon glyphicon-download-alt" aria-hidden="true"></i>&nbsp;CSV</button>
			</div>
		</div>
	</div>
</form>	
						</div>
					</div>
					<div id="grid-panel" class="rsz-panel size-6">
						<div class="panel-content">
							<div id="grid"></div>
						</div>
					</div>
				</div>
			</div>
			<div id="graph-panel" class="rsz-panel size-6">
				<div class="panel-content">
					<div class="graph-container">
						<div id="graph"></div>
					</div>
					
				</div>
			</div>
		</div>
	</div>

	<footer aria-hidden="true">&copy;&nbsp;Greeno Project - All right reserved</footer>
	
	</body>
</html>
<?php
	define('_WSRV', 1);


	require_once "inc/errors.php";
	require_once "inc/request.php";
	require_once "inc/parser.php";


	try{
		$sep = filter_input(INPUT_GET, 'sep', FILTER_SANITIZE_STRING);

		if($sep == 'semicolon'){
			define("CSV_COLSEP", ";");
			define("CSV_DECSEP", ",");
		}
		else{
			define("CSV_COLSEP", ",");
			define("CSV_DECSEP", ".");
		}
		define("CSV_EOL", "\r\n");

		$request = Request::FromInputs();

		$fileName = "{$request->month}-{$request->type}";
		if($request->isMultipleAreas())
		{
			$fileName = $request->area.'-'.$fileName;
		}
		if($request->raw)
		{
			$fileName .= '-raw';
		}
		$fileName .= '.csv';


		$parsedData = new ParsedData($request);

		$decimals  = $parsedData->getDecimals();
		$nodes     = $parsedData->getData();
		$nodeCount = count($nodes);

		ob_start();

		// Print header
		$labels = implode('"'.CSV_COLSEP.'"', $parsedData->getLabels());
		echo '"Local time"'.(empty($labels)?'': CSV_COLSEP.'"'.$labels.'"').CSV_EOL;

		// Print content
		foreach ($parsedData->getTimestamps() as $row => $timestamp)
		{
			echo date('Y/m/d H:i:s', $timestamp);

			for ($i=0; $i < $nodeCount; $i++)
			{ 
				$val = $nodes[$i][$row];

				echo CSV_COLSEP . (isset($val)? number_format($val, $decimals, CSV_DECSEP, '') : '');
			}

			echo CSV_EOL;
		}


		// Set Download headers
		// header("Content-Type: text/plain; charset=UTF-8"); // for debug only
		header("Content-type: text/csv; charset=UTF-8");
		header("Content-Disposition: attachment; filename*=UTF-8''". rawurlencode($fileName)); // comment this line on debug

	}
	catch (RequestException $e)
	{
		printError($e->getStatus(), $e->getMessage());
	}
	catch (Exception $e)
	{	
		printError(500, 'There was an internal server error. Please contact the site administrator.');
		exception_log($e);
	}
	
	header("Content-Length: ".ob_get_length());
	ob_end_flush();


	function printError($status, $msg)
	{
		ob_clean();

		http_response_code($status);
		header("Content-Type: text/plain; charset=UTF-8");
		echo $msg;
	}

?>
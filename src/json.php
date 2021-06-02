<?php
	
define('_WSRV', 1);


require_once "inc/errors.php";
require_once "inc/request.php";
require_once "inc/cache.php";
require_once "inc/data_file.php";
require_once "inc/parser.php";
require_once "inc/json_response.php";


class App {

	public static function Execute()
	{
		try{

			// Deny external requests
			if(Request::IsRefererAllowed() == FALSE)
			{
				http_response_code(403); // Forbidden
				return;
			}

			// ---- Send the list of the available data file ----
			if(strcasecmp(filter_input(INPUT_GET, 'list', FILTER_SANITIZE_STRING), 'all')==0)
			{
				JsonResponse::Send(DataFile::GetAllAvailable());
				return;
			}

			// ---- Send data (using cache if possible) ----
			$request = Request::FromInputs();

			$dataFile = $request->getDataFile();


			if(CacheManager::IsUserCacheFresh($dataFile))
			{
				http_response_code(304); // Not Modified
				return;
			}


			$cache = CacheEntry::Open($request);

			if(isset($cache) && $cache->isFresh())
			{
				$done = JsonResponse::SendFromCache($cache);
				if($done) return;
			}


			$parsedData = new ParsedData($request, $cache);
			
			// Build the response ad send it 
			$response = array(
				'labels'     => $parsedData->getLabels(),
				'timestamps' => $parsedData->getTimestamps(),
				'data'       => $parsedData->getData(),
				'decimals'   => $parsedData->getDecimals()
			);

			JsonResponse::Send($response, $dataFile->getLastModified());


			// Save response into cache
			if(isset($cache))
			{
				$cacheData = new CacheData();
				$cacheData->lastModified = $dataFile->getLastModified();
				$cacheData->parserOffset = $parsedData->getNextOffset();
				$cacheData->addressList  = $parsedData->getAddressList();
				$cacheData->cachedResponse = $response;

				$cache->save($cacheData);
			}

		}

		catch (RequestException $e) {
			JsonResponse::SendRequestError($e);
		}

		catch (Exception $e)
		{
			JsonResponse::SendError(500, "There was an internal server error. Please contact the site administrator.");
			
			exception_log($e);
		}

		
		if(isset($cache) && $cache !== FALSE) {
			$cache->close();
		}

	}

}


App::Execute();

?>
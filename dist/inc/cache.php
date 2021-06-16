<?php

defined('_WSRV') or die;


require_once "inc/costants.php";
require_once "inc/errors.php";
require_once "inc/request.php";
require_once "inc/data_file.php";


class CacheData
{
	public $lastModified;
	public $parserOffset;
	public $addressList;
	public $cachedResponse;
}



class CacheEntry
{
	private $fHandle = NULL;

	private $fresh;
	private $dataPos;

	public $lastModified;
	public $parserOffset;
	public $addressList;


	private $path;

	public static function Open(Request $request)
	{
		$retObj = new CacheEntry();

		// Don't create a new file for those data types that haven't an associated raw version
		$rawSuffix = (Parser::HasRawOption($request->type) && $request->raw)? '-1' : '';

		$cachefile = CACHE_PATH ."/{$request->area}-{$request->month}-{$request->type}{$rawSuffix}.cache";

		$retObj->path = $cachefile;

		// Open an existing cache file
		$handle = @fopen($cachefile, 'r+');
		if($handle !== FALSE)
		{
			$retObj->fHandle = $handle;
			$ReadVersion = "";
			
			try {
				// Gain exclusive lock on the file so other request won't interfere
				if(flock($retObj->fHandle, LOCK_EX) == FALSE)
				{
					throw new Exception("Cannot gain exclusive lock on reading ".$cachefile);
				};

				$sHeader = fgets($handle);
				if($sHeader === FALSE){
					throw new Exception("Cannot read cache entry header in ".$cachefile);
				}

				$header = explode(',', trim($sHeader));
				if(count($header) !== 4){
					throw new Exception("Invalid cache entry header found in ".$cachefile);
				}

				$ReadVersion = $header[0];
				$retObj->lastModified = intval($header[1]);
				$retObj->parserOffset = intval($header[2]);
				$retObj->addressList  = explode('|', $header[3]);
			
				$retObj->dataPos = ftell($handle);
				$retObj->fresh = ($retObj->lastModified == $request->getDataFile()->getLastModified());
			}
			catch (Exception $e)
			{
				//Any invalid file will be close and then overwitten (see below)
				$retObj->close();
				exception_log($e, __METHOD__);
			}

			// Check if api versions match, otherwise close and overwrite the file
			if($ReadVersion === APP_VERSION) {
				return $retObj;
			}
			else {
				$retObj->close();
			}
		}

		// Create a new cache file
		$handle = @fopen($cachefile, 'w');
		if($handle !== FALSE)
		{
			$retObj->fHandle = $handle;

			// Gain exclusive lock on the file so other request won't interfere
			if(flock($handle, LOCK_EX) == FALSE)
			{
				$retObj->close();
				return NULL;
			};

			$retObj->lastModified = NULL;
			$retObj->parserOffset  = 0;
			$retObj->addressList = array();

			$retObj->dataPos = 0;
			$retObj->fresh = FALSE;

			return $retObj;
		}

		return NULL;
	}


	public final function isFresh()
	{
		return $this->fresh;
	}


	public final function output($gzipped = FALSE)
	{
		$rslt = @fseek($this->fHandle, $this->dataPos);
		if($rslt != 0)
		{
			throw new Exception("Unknow error in ".$this->path);
		}

		if($gzipped)
		{
			$rslt = @fpassthru($this->fHandle);
			if($rslt === FALSE)
			{
				throw new Exception("Error reading cached response from ".$this->path);
			}
		}
		else
		{
			$gzResponse = @stream_get_contents($this->fHandle);
			if($gzResponse === FALSE){
				throw new Exception("Error reading cached response from ".$this->path);
			}
			
			$response = @gzdecode($gzResponse);
			if($response === FALSE){
				throw new Exception("Error reading cached response from ".$this->path);
			}

			echo $response;
		}
	}


	public final function getLastModified()
	{
		return $this->lastModified;
	}


	public final function getLastParsedData()
	{
		try
		{
			$data = $this->getData();
			return $data;
		}
		catch (Exception $e) {
			exception_log($e, __METHOD__);
		}

		return NULL;
	}


	private final function getData()
	{
		// Validate cached response
		if($this->parserOffset <= 0)
		{
			return NULL;
		}

		$rslt = @fseek($this->fHandle, $this->dataPos);
		if($rslt != 0) {
			throw new Exception("Unknown error reading cached data from ".$this->path);
		}

		$compressed = @stream_get_contents($this->fHandle);
		if(strlen($compressed) == 0) {
			throw new Exception("Error reading cached data from ".$this->path);
		}

		$jsonResponse = @gzdecode($compressed);
		if($jsonResponse == FALSE) {
			throw new Exception("Error extracting cached data from ".$this->path);
		}

		$response = @json_decode($jsonResponse, TRUE);
		if(!isset($response)) {
			throw new Exception("Error decoding cached data from ".$this->path);
		}

		$timestamps = @$response['timestamps'];
		$data = @$response['data'];
		if(!isset($timestamps) || !isset($data)) {
			throw new Exception("Malformed data found in ".$this->path);
		}

		$nodes = @array_combine($this->addressList, $data);
		if($nodes === FALSE) {
			throw new Exception("Malformed data found in ".$this->path);
		}

		// all lengths must match
		$len = count($timestamps);
		foreach ($nodes as $nodeData) {
			if(count($nodeData) !== $len){
				throw new Exception("Malformed data found in ".$this->path);
			}
		}

		return array(
			'timestamps' => $timestamps,
			'nodes'      => $nodes,
			'offset'     => $this->parserOffset
		);
	}


	public final function save(CacheData $cacheData)
	{
		try{
			$ok1 = @rewind($this->fHandle);
			$ok2 = @ftruncate($this->fHandle, 0);
			if(!$ok1 || !$ok2) {
				throw new Exception("Unknown error in ".$this->path);
			}

			$this->lastModified = $cacheData->lastModified;
			$this->parserOffset = $cacheData->parserOffset;
			$this->addressList  = $cacheData->addressList;

			$header = APP_VERSION.','.
			          $cacheData->lastModified.','.
			          $cacheData->parserOffset.','.
			          implode('|', $cacheData->addressList)."\n";

			$result = @fwrite($this->fHandle, $header);
			if($result === FALSE) {
				throw new Exception("Unable to write to ".$this->path);
			}

			$this->dataPos = ftell($this->fHandle);

			$compressed = @gzencode(@json_encode($cacheData->cachedResponse));
			if(empty($compressed)) {
				throw new Exception("Unable to encode response for ".$this->path);
			}

			$result = fwrite($this->fHandle, $compressed);
			if($result === FALSE) {
				throw new Exception("Unable to save response in ".$this->path);
			}

			CacheManager::Purge();

			return TRUE;
		}
		catch (Exception $e) {
			exception_log($e, __METHOD__);
		}

		return FALSE;
	}


	public final function close()
	{
		if(!isset($this->fHandle))
		{
			@flock($this->fHandle, LOCK_UN);
			@fclose($this->fHandle);
			$this->fHandle = NULL;
		}
	}


	public function __destruct()
	{
		$this->close();
	}

}




class CacheManager
{
	public static function IsUserCacheFresh(DataFile $dataFile)
	{
		return (
			Request::GetIfModifiedSince() == $dataFile->getLastModified() &&
			Request::GetIfNoneMatch() == self::CalculateETag($dataFile->getLastModified())
		);
	}

	public static function CalculateETag($lastModified)
	{
		return md5(APP_VERSION.$lastModified);
	}


	public static function Purge()
	{
		$paths = array(); $sizes = array(); $aTimes = array();

		// Create a list of cache entries with their respective path, size and access time
		$files = glob(CACHE_PATH.'/*.cache', GLOB_NOSORT);
		if($files){
			foreach ($files as $fp)
			{
				array_push($paths, $fp);
				array_push($sizes, filesize($fp));
				array_push($aTimes, fileatime($fp));
			}
		}

		$totSize = array_sum($sizes);

		// Delete cache entries with the oldest access time until the total size is less than CACHE_SIZE
		if($totSize > CACHE_SIZE)
		{
			asort($aTimes);

			foreach (array_keys($aTimes) as $idx)
			{
				unlink($paths[$idx]);
				$totSize -= $sizes[$idx];
				if($totSize <= CACHE_SIZE) break;
			}
		}
	}


}

?>
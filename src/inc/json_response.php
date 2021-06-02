<?php

defined('_WSRV') or die;


require_once "inc/cache.php";
require_once "inc/request.php";
require_once "inc/errors.php";


class JsonResponse
{
	static private $ResponseSent = FALSE;

	static public function Send($data, $lastModified = NULL)
	{
		if(self::$ResponseSent) return FALSE;

		self::prepareHeaders($lastModified);

		self::output(json_encode($data));

		self::$ResponseSent = TRUE;
		return TRUE;
	}


	static public function SendFromCache(CacheEntry $cache)
	{
		if(self::$ResponseSent) return FALSE;
	
		$gzEncoding = Request::GzipAccepted();

		ob_start();
		try
		{
			$cache->output($gzEncoding);
		}
		catch (Exception $e)
		{
			ob_end_clean();
			exception_log($e, __METHOD__);
			return FALSE;
		}

		self::prepareHeaders($cache->getLastModified());
		if($gzEncoding) header('Content-Encoding: gzip');
		header('Content-Length: '.ob_get_length());
		ob_end_flush();

		self::$ResponseSent = TRUE;
		return TRUE;
	}


	static public function SendError($status, $message)
	{
		if(self::$ResponseSent) return FALSE;

		self::prepareHeaders();
		http_response_code($status);

		$response = array('error' => $message);

		self::output(json_encode($response));

		self::$ResponseSent = TRUE;
		return TRUE;
	}


	static public function SendRequestError(RequestException $requestException)
	{
		if(self::$ResponseSent) return FALSE;

		self::prepareHeaders();
		http_response_code($requestException->getStatus());

		$respose = array('error' => $requestException->getMessage());

		$errParam = $requestException->getErrorParam();
		if(isset($errParam)){
			$respose['param'] = $errParam;
		}

		self::output(json_encode($respose));

		self::$ResponseSent = TRUE;
		return TRUE;
	}


	static private function prepareHeaders($lastModified = NULL)
	{
		header('Content-type: application/json; charset=UTF-8');

		if(isset($lastModified)) {
			header('Last-Modified: '.gmdate('D, d M Y H:i:s', $lastModified).' GMT');
			header('ETag: '. CacheManager::CalculateEtag($lastModified));
			header('Cache-Control: max-age=0, must-revalidate');
		}
		else{
			header('Cache-Control: no-store');
		}
	}


	static private function output($content)
	{
		if(Request::GzipAccepted())
		{
			$compressed = gzencode($content);
			header('Content-Encoding: gzip');
			header('Content-Length: '.strlen($compressed));
			echo $compressed;
		}
		else
		{
			header('Content-Length: '.strlen($content));
			echo $content;
		}

		flush();
	}


}

?>
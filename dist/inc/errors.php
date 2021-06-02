<?php

defined('_WSRV') or die;

require_once 'inc/costants.php';


class RequestException extends Exception
{
	private $_httpStatus;
	private $_errorParam;

	public function __construct($message, $httpStatus = 400, $errorParam = NULL)
	{
		parent::__construct($message);

		$this->_httpStatus = $httpStatus;
		$this->_errorParam = $errorParam;
	}

	final function getStatus(){
		return $this->_httpStatus;
	}

	final function getErrorParam(){
		return $this->_errorParam;
	}
}


function exception_log($e, $context='')
{
	if(!empty($context)) $context .= ': ';
	$msg = "{$context}{$e->getMessage()} in {$e->getFile()} on line {$e->getLine()}";
	
	if(defined('ERROR_LOG_PATH') && strlen(ERROR_LOG_PATH) != 0) {
		$now = date('d-M-Y H:i:s e');
		error_log("[{$now}] {$msg}\n\n", 3, ERROR_LOG_PATH);
	}
	else {
		error_log($msg);
	}
}



// NOTE: It's worth noting that no matter what you do, "E_ERROR, E_PARSE, E_CORE_ERROR, 
//       E_CORE_WARNING, E_COMPILE_ERROR, E_COMPILE_WARNING, and most of E_STRICT" will never reach 
//       this custom error handler, and therefore will not be converted into ErrorExceptions.
//       See: https://www.php.net/manual/en/function.set-error-handler.php 



function error_exception_handler($errno, $errstr, $errfile, $errline)
{
	// Ignore @error-control operator
	if(error_reporting() == 0) return TRUE; 

	// throw an Error Exception, to be handled by whatever Exception handling logic is available in this context
	throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
}


set_error_handler("error_exception_handler");

ini_set('display_errors', 0);


/*
function error_exception_handler($errno, $errstr, $errfile, $errline)
{
	// Determine if this error is one of the enabled ones in php config
	//  (php.ini, .htaccess, @ error-control operator, etc)
	if($errno & error_reporting())
	{
		// -- FATAL ERROR
		// throw an Error Exception, to be handled by whatever Exception handling logic is available in this context
		if($errno == E_USER_ERROR || $errno == E_RECOVERABLE_ERROR) {
			throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
		}

		// -- NON-FATAL ERROR/WARNING/NOTICE
		// log the error
		return FALSE;
	}

	// ... otherwise just ignore it
	return TRUE;
}
*/




?>
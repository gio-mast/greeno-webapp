@ECHO OFF

SET test_path="C:\xampp\www\wsn-test\admin"

cmd /c grunt

ECHO.

IF errorlevel 1 GOTO error

ECHO Copying files into test path (%test_path%)

DEL /S /Q %test_path% 1>NUL
xcopy /E /Y /Q dist %test_path%

IF errorlevel 1 GOTO error

GOTO done

:error
ECHO Build failed

:done

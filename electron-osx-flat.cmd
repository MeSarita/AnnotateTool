@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\..\electron-osx-sign\bin\electron-osx-flat.js" %*
) ELSE (
  @SETLOCAL
  @SET PATHEXT=%PATHEXT:;.JS;=;%
  node  "%~dp0\..\electron-osx-sign\bin\electron-osx-flat.js" %*
)
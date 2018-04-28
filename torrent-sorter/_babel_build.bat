@ECHO OFF
cd /d %~dp0
npx babel . --out-dir dist --ignore node_modules,dist
pause
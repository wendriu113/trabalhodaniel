# Project-local Graphify installation; no global Python/PATH changes required.
$ErrorActionPreference = 'Stop'
$graphifyRoot = Split-Path -Parent $PSScriptRoot
$graphifyPython = Join-Path $graphifyRoot '.cache/graphify-venv/Scripts/python.exe'
if (-not (Test-Path -LiteralPath $graphifyPython)) { throw 'Ambiente Graphify ausente. Execute /graphify para preparar o ambiente local.' }
$env:PYTHONUTF8 = '1'
Push-Location -LiteralPath $graphifyRoot
try { & $graphifyPython -m graphify @args; $graphifyExit = $LASTEXITCODE }
finally { Pop-Location }
exit $graphifyExit

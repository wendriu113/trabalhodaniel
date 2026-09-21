param([switch]$Resume)
$ErrorActionPreference = 'Stop'
$credentialsPath = Join-Path $env:USERPROFILE '.omniroute/codex-local.json'
if (-not (Test-Path -LiteralPath $credentialsPath)) { throw 'Execute a configuracao do OmniRoute primeiro.' }
$credentials = Get-Content -LiteralPath $credentialsPath -Raw | ConvertFrom-Json
$env:OMNIROUTE_API_KEY = $credentials.apiKey
try {
  Invoke-RestMethod 'http://127.0.0.1:20128/api/monitoring/health' -TimeoutSec 10 | Out-Null
} catch { throw 'Inicie scripts/start-omniroute.ps1 em outro terminal antes de continuar.' }
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
if ($Resume) { & codex --profile omniroute resume } else { & codex --profile omniroute }
exit $LASTEXITCODE

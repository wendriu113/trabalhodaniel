param([switch]$StartOnly, [switch]$E2E, [switch]$Backend)
$ErrorActionPreference = 'Stop'
$sgoWorkspace = Split-Path -Parent $PSScriptRoot
$sgoJavaFolder = Get-ChildItem -LiteralPath (Join-Path $sgoWorkspace '.cache/java21') -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
if ($sgoJavaFolder) { $env:JAVA_HOME = $sgoJavaFolder.FullName; $env:Path = (Join-Path $sgoJavaFolder.FullName 'bin') + ';' + $env:Path }
$env:FIREBASE_EMULATORS_PATH = Join-Path $sgoWorkspace '.cache/firebase-emulators'
$env:FIREBASE_CLI_DISABLE_UPDATE_CHECK = 'true'
$env:DEBUG = ''
$env:FUNCTIONS_DISCOVERY_TIMEOUT = '60'
$env:GCLOUD_PROJECT = 'demo-sgo'
$env:GOOGLE_CLOUD_PROJECT = 'demo-sgo'
if ($StartOnly) { & npx firebase emulators:start --project demo-sgo --only auth,firestore,storage,functions }
elseif ($E2E) { & npx firebase emulators:exec --project demo-sgo --only auth,firestore,storage,functions 'npm run test:e2e' }
elseif ($Backend) { & npm run test:backend }
else { & npm run test:rules }
exit $LASTEXITCODE

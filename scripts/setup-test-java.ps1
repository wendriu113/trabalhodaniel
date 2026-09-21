$ErrorActionPreference = 'Stop'
$sgoWorkspace = Split-Path -Parent $PSScriptRoot
$sgoCache = Join-Path $sgoWorkspace '.cache'
New-Item -ItemType Directory -Force -Path $sgoCache | Out-Null
$sgoAssets = Invoke-RestMethod 'https://api.adoptium.net/v3/assets/latest/21/hotspot?architecture=x64&image_type=jre&os=windows&vendor=eclipse'
$sgoPackage = $sgoAssets[0].binary.package
$sgoArchive = Join-Path $sgoCache 'java21.zip'
Invoke-WebRequest -Uri $sgoPackage.link -OutFile $sgoArchive -UseBasicParsing
if ((Get-FileHash -LiteralPath $sgoArchive -Algorithm SHA256).Hash.ToLower() -ne $sgoPackage.checksum.ToLower()) { throw 'Checksum do Java diferente do publicado.' }
Expand-Archive -LiteralPath $sgoArchive -DestinationPath (Join-Path $sgoCache 'java21') -Force
Get-ChildItem (Join-Path $sgoCache 'java21') -Directory | Select-Object FullName

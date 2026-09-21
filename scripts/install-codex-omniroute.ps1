$ErrorActionPreference = 'Stop'
$profilePath = Join-Path $env:USERPROFILE '.codex/omniroute.config.toml'
$profileText = @'
# Perfil separado: nao altera a conexao padrao do Codex.
# Use scripts/start-codex-free.ps1 para carregar a chave local.
model = "auto/coding:free"
model_provider = "omniroute"
model_reasoning_effort = "low"
model_context_window = 32768
model_auto_compact_token_limit = 24000
tool_output_token_limit = 4096

[model_providers.omniroute]
name = "OmniRoute gratuito local"
base_url = "http://127.0.0.1:20128/v1"
env_key = "OMNIROUTE_API_KEY"
requires_openai_auth = false
wire_api = "responses"
supports_websockets = false
'@
if ((Test-Path -LiteralPath $profilePath) -and (Get-Content -LiteralPath $profilePath -Raw) -ne $profileText) {
  Copy-Item -LiteralPath $profilePath -Destination ($profilePath + '.backup-' + (Get-Date -Format 'yyyyMMddHHmmss'))
}
[IO.File]::WriteAllText($profilePath, $profileText, [Text.UTF8Encoding]::new($false))
$credentialsPath = Join-Path $env:USERPROFILE '.omniroute/codex-local.json'
if (Test-Path -LiteralPath $credentialsPath) {
  # Credenciais acessiveis somente ao usuario atual; nunca entram no repositorio.
  $acl = Get-Acl -LiteralPath $credentialsPath
  $acl.SetAccessRuleProtection($true, $false)
  $rule = [Security.AccessControl.FileSystemAccessRule]::new([Security.Principal.WindowsIdentity]::GetCurrent().User, 'FullControl', 'Allow')
  $acl.SetAccessRule($rule)
  Set-Acl -LiteralPath $credentialsPath -AclObject $acl
}
Write-Output "Perfil instalado: $profilePath"

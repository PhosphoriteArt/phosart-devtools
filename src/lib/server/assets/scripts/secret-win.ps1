# win-secret.ps1
# Reads stdin: COMMAND\nHANDLE\n[VALUE_B64]\n
# Writes stdout: STATUS\nPAYLOAD\n

$ErrorActionPreference = "Stop"

function Out-TwoLines([string]$status, [string]$payload) {
  Write-Output $status
  Write-Output $payload
}

try {
  $lines = @()
  while ($null -ne ($l = [Console]::In.ReadLine())) { $lines += $l }

  if ($lines.Count -lt 2) { Out-TwoLines "ERROR" "invalid input"; exit 0 }

  $cmd = $lines[0].Trim()
  $handle = $lines[1].Trim()

  if ($handle -notmatch '^[A-Za-z0-9._-]{1,128}$') {
    Out-TwoLines "ERROR" "invalid handle"
    exit 0
  }

  $baseDir = Join-Path $env:LOCALAPPDATA "phosart-devtool\secrets"
  [IO.Directory]::CreateDirectory($baseDir) | Out-Null
  $path = Join-Path $baseDir "$handle.bin"

  Add-Type -AssemblyName System.Security

  function Protect([byte[]]$plain) {
    return [Security.Cryptography.ProtectedData]::Protect(
      $plain, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser
    )
  }

  function Unprotect([byte[]]$cipher) {
    return [Security.Cryptography.ProtectedData]::Unprotect(
      $cipher, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser
    )
  }

  function ReadExistingB64OrNull() {
    if (-not (Test-Path -LiteralPath $path)) { return $null }
    $cipher = [IO.File]::ReadAllBytes($path)
    $plain = Unprotect $cipher
    return [Convert]::ToBase64String($plain)
  }

  if ($cmd -eq "READ") {
    $cur = ReadExistingB64OrNull
    if ($null -eq $cur) { Out-TwoLines "MISSING" "null" } else { Out-TwoLines "OK" $cur }
    exit 0
  }

  if ($cmd -eq "WRITE") {
    if ($lines.Count -lt 3) { Out-TwoLines "ERROR" "missing value"; exit 0 }
    $valueB64 = $lines[2].Trim()
    $newPlain = [Convert]::FromBase64String($valueB64)

    $old = ReadExistingB64OrNull

    $cipher = Protect $newPlain
    [IO.File]::WriteAllBytes($path, $cipher)

    if ($null -eq $old) { Out-TwoLines "OK" "null" } else { Out-TwoLines "OK" $old }
    exit 0
  }

  if ($cmd -eq "DELETE") {
    $old = ReadExistingB64OrNull
    if (Test-Path -LiteralPath $path) { Remove-Item -LiteralPath $path -Force }
    if ($null -eq $old) { Out-TwoLines "MISSING" "null" } else { Out-TwoLines "OK" $old }
    exit 0
  }

  Out-TwoLines "ERROR" "unknown command"
} catch {
  Out-TwoLines "ERROR" ($_.Exception.Message.Replace("`r","").Replace("`n"," "))
}

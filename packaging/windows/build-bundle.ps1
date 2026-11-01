param (
  [string]$Version = "1.0.0"
)

$ErrorActionPreference = "Stop"
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent (Split-Path -Parent $Here)
$Dist = Join-Path $Root "dist\remote-control"

Write-Host "Assembling Windows bundle in $Dist..."
if (Test-Path $Dist) { Remove-Item -Recurse -Force $Dist }
New-Item -ItemType Directory -Force (Join-Path $Dist "bin") | Out-Null
New-Item -ItemType Directory -Force (Join-Path $Dist "src") | Out-Null
New-Item -ItemType Directory -Force (Join-Path $Dist "decks") | Out-Null

Copy-Item -Recurse (Join-Path $Root "bin\*") (Join-Path $Dist "bin")
Copy-Item -Recurse (Join-Path $Root "src\*") (Join-Path $Dist "src")
Copy-Item -Recurse (Join-Path $Root "decks\*") (Join-Path $Dist "decks")
Copy-Item (Join-Path $Root "package.json") $Dist
if (Test-Path (Join-Path $Root "node_modules")) {
  Copy-Item -Recurse (Join-Path $Root "node_modules") $Dist
}

# Windows CMD launcher
$cmdContent = "@echo off`r`nstart """" node ""%~dp0bin\remote-control.js"" %*"
Set-Content -Path (Join-Path $Dist "remote-control.cmd") -Value $cmdContent

Write-Host "Windows bundle ready in $Dist"

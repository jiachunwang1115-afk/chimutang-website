param(
  [string]$PnpmCommand = "pnpm"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$codexNodeBin = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
if ((Test-Path (Join-Path $codexNodeBin "node.exe")) -and -not (Get-Command node -ErrorAction SilentlyContinue)) {
  $env:PATH = "$codexNodeBin;$env:PATH"
}

function Run-Step {
  param(
    [string]$Name,
    [scriptblock]$Command
  )
  Write-Host "==> $Name"
  & $Command
}

Run-Step "Minify CSS" {
  & $PnpmCommand dlx clean-css-cli@5.6.3 -O2 -o style.min.css style.css
}

Run-Step "Minify app JS" {
  & $PnpmCommand dlx terser@5.31.6 app.js --compress passes=2 --mangle --format comments=false -o app.min.js
}

Run-Step "Minify Muchi data JS" {
  & $PnpmCommand dlx terser@5.31.6 journal/muchi_articles_data.js --compress passes=2 --mangle --format comments=false -o journal/muchi_articles_data.min.js
}

Run-Step "Syntax check minified JS" {
  node --check app.min.js
  node --check journal/muchi_articles_data.min.js
}

Write-Host "Minified assets are up to date."

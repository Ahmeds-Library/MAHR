# MAHR Autonomous Desktop AI Assistant - Windows Standalone Engine
$ErrorActionPreference = "SilentlyContinue"
$appDir = Join-Path $PSScriptRoot "app"
$port = 19842

# Check if node is available and use it
if (Get-Command node -ErrorAction SilentlyContinue) {
    & node "$PSScriptRoot\desktop-runner.cjs"
    exit
}

# Start local HTTP server
$listener = New-Object System.Net.HttpListener
try {
    $listener.Prefixes.Add("http://127.0.0.1:$port/")
    $listener.Start()
} catch {
    $port = 19843
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://127.0.0.1:$port/")
    $listener.Start()
}

$url = "http://127.0.0.1:$port/?desktop=1"

# Launch Desktop Browser Window
$browsers = @(
    "$env:ProgramFiles (x86)\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "$env:ProgramFiles (x86)\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
    "$env:ProgramFiles\BraveSoftware\Brave-Browser\Application\brave.exe"
)

$userDataDir = Join-Path $env:LOCALAPPDATA "mahr-desktop"
$launched = $false
foreach ($b in $browsers) {
    if (Test-Path $b) {
        Start-Process $b -ArgumentList "--app=$url", "--user-data-dir=`"$userDataDir`"", "--name=`"MAHR AI Desktop`"", "--no-first-run"
        $launched = $true
        break
    }
}
if (-not $launched) {
    Start-Process $url
}

$mime = @{
    ".html" = "text/html; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".webmanifest" = "application/manifest+json; charset=utf-8"
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $req = $context.Request
    $res = $context.Response
    
    $reqPath = $req.Url.LocalPath.TrimStart('/')
    if ([string]::IsNullOrEmpty($reqPath)) { $reqPath = "index.html" }
    
    $filePath = Join-Path $appDir $reqPath
    if (-not (Test-Path $filePath -PathType Leaf)) {
        $filePath = Join-Path $appDir "index.html"
    }
    
    $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
    $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" }
    $res.AddHeader("Access-Control-Allow-Origin", "*")
    $res.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    
    try {
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } catch {}
    $res.Close()
}

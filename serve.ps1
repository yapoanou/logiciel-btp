param(
    [int]$Port = 8000,
    [string]$Root = "."
)

$ErrorActionPreference = "Stop"

function Get-ContentType([string]$Path) {
    switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
        ".html" { "text/html; charset=utf-8" }
        ".htm"  { "text/html; charset=utf-8" }
        ".js"   { "application/javascript; charset=utf-8" }
        ".css"  { "text/css; charset=utf-8" }
        ".json" { "application/json; charset=utf-8" }
        ".png"  { "image/png" }
        ".jpg"  { "image/jpeg" }
        ".jpeg" { "image/jpeg" }
        ".gif"  { "image/gif" }
        ".svg"  { "image/svg+xml; charset=utf-8" }
        ".ico"  { "image/x-icon" }
        ".webp" { "image/webp" }
        ".txt"  { "text/plain; charset=utf-8" }
        default { "application/octet-stream" }
    }
}

$rootFull = [System.IO.Path]::GetFullPath($Root)

$listener = [System.Net.HttpListener]::new()
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
} catch {
    Write-Host "Failed to start server on $prefix"
    throw
}

Write-Host "Serving $rootFull on $prefix"

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $relative = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath.TrimStart("/"))
        if ([string]::IsNullOrWhiteSpace($relative)) { $relative = "index.html" }

        $candidate = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($rootFull, $relative))
        if (-not $candidate.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
            $response.StatusCode = 400
            $bytes = [System.Text.Encoding]::UTF8.GetBytes("Bad Request")
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        if ([System.IO.Directory]::Exists($candidate)) {
            $candidate = [System.IO.Path]::Combine($candidate, "index.html")
        }

        if (-not [System.IO.File]::Exists($candidate)) {
            $response.StatusCode = 404
            $bytes = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        $response.StatusCode = 200
        $response.ContentType = Get-ContentType $candidate

        $fs = [System.IO.File]::OpenRead($candidate)
        try {
            $response.ContentLength64 = $fs.Length
            $fs.CopyTo($response.OutputStream)
        } finally {
            $fs.Close()
            $response.OutputStream.Close()
        }
    } catch {
        try { $response = $context.Response; $response.StatusCode = 500; $response.Close() } catch {}
    }
}


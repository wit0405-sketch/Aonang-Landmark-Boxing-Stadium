$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath($PSScriptRoot)
$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 8765)
$listener.Start()
Write-Host 'Website: http://localhost:8765'
Write-Host 'Keep this window open while using the site. Press Ctrl+C to stop.'
try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
      $request = $reader.ReadLine()
      while (($line = $reader.ReadLine()) -ne '') { }
      $path = if ($request -match '^GET\s+(\S+)') { $matches[1].Split('?')[0] } else { '/' }
      $relative = [Uri]::UnescapeDataString($path.TrimStart('/'))
      if ([string]::IsNullOrWhiteSpace($relative)) { $relative = 'index.html' }
      $target = [IO.Path]::GetFullPath([IO.Path]::Combine($root, $relative))
      if (-not $target.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $target -PathType Leaf)) {
        $status = '404 Not Found'; $mime = 'text/plain; charset=utf-8'; $bytes = [Text.Encoding]::UTF8.GetBytes('Not found')
      } else {
        $status = '200 OK'
        $mime = switch ([IO.Path]::GetExtension($target).ToLowerInvariant()) { '.html' {'text/html; charset=utf-8'} '.js' {'text/javascript; charset=utf-8'} '.css' {'text/css; charset=utf-8'} '.jpg' {'image/jpeg'} '.jpeg' {'image/jpeg'} '.png' {'image/png'} '.webp' {'image/webp'} '.svg' {'image/svg+xml'} default {'application/octet-stream'} }
        $bytes = [IO.File]::ReadAllBytes($target)
      }
      $header = [Text.Encoding]::ASCII.GetBytes("HTTP/1.1 $status`r`nContent-Type: $mime`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`nAccess-Control-Allow-Origin: *`r`n`r`n")
      $stream.Write($header, 0, $header.Length); $stream.Write($bytes, 0, $bytes.Length); $stream.Flush()
    } catch { }
    finally { $client.Dispose() }
  }
} finally { $listener.Stop() }

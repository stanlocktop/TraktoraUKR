$root = $PSScriptRoot
Copy-Item (Join-Path $root 'index.html'), (Join-Path $root 'app.js'), (Join-Path $root 'products.js'), (Join-Path $root 'styles.css') (Join-Path $root 'site') -Force
robocopy (Join-Path $root 'img') (Join-Path $root 'site\img') /MIR /XD src /NJH /NJS /NDL /NFL | Out-Null
$old = Join-Path $root 'site\images'
if (Test-Path -LiteralPath $old) { Remove-Item -LiteralPath $old -Recurse -Force }
Write-Output ("sync done, robocopy=" + $LASTEXITCODE)

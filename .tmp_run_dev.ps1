Set-StrictMode -Version Latest
Set-Location 'D:\Finbers-Link'
Write-Host '---CMD1: create dir---'
New-Item -ItemType Directory -Path .next\cache\swc\win32-x64-msvc -Force | Out-Null
Write-Host '---CMD1-DONE---'
Write-Host '---CMD2: listing---'
if (Test-Path .next) {
  Get-ChildItem -Path .next -Recurse -Force | Select-Object -First 10 | Format-List | Out-String | Write-Host
} else {
  Write-Host '.next does not exist'
}
Write-Host '---CMD3: npm run dev start---'
$logOut = Join-Path $PWD 'npm_run_dev_output.log'
$logErr = Join-Path $PWD 'npm_run_dev_error.log'
$proc = Start-Process -FilePath npm -ArgumentList 'run','dev' -WorkingDirectory $PWD -NoNewWindow -RedirectStandardOutput $logOut -RedirectStandardError $logErr -PassThru
$finished = $proc.WaitForExit(90000)
if (-not $finished) {
  Write-Host '---CMD3-TIMEOUT: Process did not exit within 90s; stopping process ---'
  try { $proc | Stop-Process -Force } catch {}
}
$exitCode = $proc.ExitCode
Write-Host '---CMD3-EXITCODE:' $exitCode
Write-Host '---CMD3-STDOUT---'
if (Test-Path $logOut) { Get-Content -Raw -LiteralPath $logOut -ErrorAction SilentlyContinue | Write-Host } else { Write-Host '<no stdout log>' }
Write-Host '---CMD3-ENDSTDOUT---'
Write-Host '---CMD3-STDERR---'
if (Test-Path $logErr) { Get-Content -Raw -LiteralPath $logErr -ErrorAction SilentlyContinue | Write-Host } else { Write-Host '<no stderr log>' }
Write-Host '---CMD3-ENDSTDERR---'
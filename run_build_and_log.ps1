$log = Join-Path $env:TEMP 'finbers_build.log'
if (Test-Path $log) { Remove-Item -Force $log }
Write-Output "Running npm run build, logging to: $log"
$proc = Start-Process -FilePath npm -ArgumentList 'run','build' -NoNewWindow -RedirectStandardOutput $log -RedirectStandardError $log -PassThru -Wait
Write-Output "EXIT:$($proc.ExitCode)"

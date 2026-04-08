$log = Join-Path $env:TEMP 'finbers_build.log'
if (Test-Path $log) { Remove-Item -Force $log }
Write-Output "Running npm run build, logging to: $log"
& npm run build 2>&1 | Tee-Object -FilePath $log
$exit = $LASTEXITCODE
Write-Output "EXIT:$exit"
exit $exit

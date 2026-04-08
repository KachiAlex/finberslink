Write-Output "Stopping node processes..."
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

$nm = 'D:\Finbers-Link\node_modules'
if (Test-Path $nm) {
    Write-Output "Taking ownership (takeown)..."
    cmd /c "takeown /F \"$nm\" /R /D Y"
    Write-Output "Granting permissions (icacls)..."
    cmd /c "icacls \"$nm\" /grant \"%USERNAME%\":F /T /C"

    Write-Output "Removing node_modules..."
    Try {
        Remove-Item -LiteralPath $nm -Recurse -Force -ErrorAction Stop
        Write-Output "node_modules removed"
    } Catch {
        Write-Output "node_modules still exists - using robocopy mirror trick..."
        $empty = 'C:\empty_for_rm'
        if (-not (Test-Path $empty)) { New-Item -ItemType Directory -Path $empty | Out-Null }
        robocopy $empty $nm /MIR /NFL /NDL /NJH /NJS | Out-Null
        Try { Remove-Item -LiteralPath $nm -Recurse -Force -ErrorAction Stop; Write-Output "node_modules removed via robocopy" } Catch { Write-Output "Failed to remove node_modules after robocopy: $($_.Exception.Message)" }
        if (Test-Path $empty) { Remove-Item -LiteralPath $empty -Recurse -Force -ErrorAction SilentlyContinue }
    }
} else {
    Write-Output "node_modules not present"
}

Write-Output "Removing zeptomatch cache zip(s)..."
$cachePath = Join-Path $env:LOCALAPPDATA 'Yarn\\Berry\\cache'
Get-ChildItem -Path $cachePath -Filter 'zeptomatch*.zip' -File -ErrorAction SilentlyContinue | ForEach-Object {
    Try {
        Remove-Item $_.FullName -Force -ErrorAction Stop
        Write-Output "Removed $($_.FullName)"
    } Catch {
        Write-Output "Failed to remove $($_.FullName): $($_.Exception.Message)"
    }
}

$log = Join-Path $env:TEMP 'finbers_yarn_install.log'
if (Test-Path $log) { Remove-Item $log -Force -ErrorAction SilentlyContinue }
Write-Output "Running yarn install --verbose, log -> $log"
# Run yarn install and tee output to log
yarn install --verbose 2>&1 | Tee-Object -FilePath $log
Write-Output "Log saved to: $log"

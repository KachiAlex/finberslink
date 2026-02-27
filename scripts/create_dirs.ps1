$paths = @(
  'd:\Finbers-Link\src\components',
  'd:\Finbers-Link\src\components\ui',
  'd:\Finbers-Link\src\features',
  'd:\Finbers-Link\src\features\lms',
  'd:\Finbers-Link\src\features\resume',
  'd:\Finbers-Link\src\features\jobs',
  'd:\Finbers-Link\src\features\volunteer',
  'd:\Finbers-Link\src\features\news',
  'd:\Finbers-Link\src\features\forum',
  'd:\Finbers-Link\src\features\dashboard',
  'd:\Finbers-Link\src\features\admin',
  'd:\Finbers-Link\src\hooks',
  'd:\Finbers-Link\src\services',
  'd:\Finbers-Link\src\types',
  'd:\Finbers-Link\src\config',
  'd:\Finbers-Link\prisma'
)

foreach ($path in $paths) {
  if (-not (Test-Path $path)) {
    New-Item -ItemType Directory -Path $path | Out-Null
  }
}

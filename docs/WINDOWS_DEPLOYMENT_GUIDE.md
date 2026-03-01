# Windows Deployment Guide - Firestore Migration

## Overview

This guide provides Windows-specific instructions for deploying the Firestore migration. Use PowerShell scripts instead of bash scripts on Windows systems.

## Prerequisites

- Windows 10 or later
- PowerShell 5.0 or later
- Node.js 18+ installed
- Git for Windows installed
- Firebase CLI installed globally

## Quick Start

### Run Deployment Script (Dry Run)
```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-firestore.ps1 -Environment staging -DryRun
```

### Run Deployment Script (Actual Deployment)
```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-firestore.ps1 -Environment production
```

## Deployment Script Options

### Parameters
- **Environment**: `staging` or `production` (default: `staging`)
- **DryRun**: Switch flag to run in dry-run mode (default: `$false`)

### Examples

**Staging Dry Run**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-firestore.ps1 -Environment staging -DryRun
```

**Staging Actual Deployment**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-firestore.ps1 -Environment staging
```

**Production Dry Run**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-firestore.ps1 -Environment production -DryRun
```

**Production Actual Deployment**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-firestore.ps1 -Environment production
```

## Manual Deployment Steps (Windows)

### Step 1: Pre-Deployment Checks

**Verify .env file**
```powershell
Test-Path .env
Get-Content .env | Select-String "FIREBASE"
```

**Verify package.json**
```powershell
Get-Content package.json | Select-String "prisma" -NotMatch
```

**Backup PostgreSQL database**
```powershell
# Using PostgreSQL command line
pg_dump finberslink > "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
```

### Step 2: Install Dependencies

```powershell
npm install
```

### Step 3: Build Application

```powershell
npm run build
```

### Step 4: Run Linting

```powershell
npm run lint
```

### Step 5: Data Migration

```powershell
npx ts-node scripts/migrate-to-firestore.ts
```

### Step 6: Validate Data

```powershell
npx ts-node scripts/validate-migration.ts
```

### Step 7: Deploy to Environment

**For Staging**
```powershell
git push staging main
```

**For Production**
```powershell
git push origin main
```

### Step 8: Post-Deployment Verification

**Check application health**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/health" -Method Get
```

**Check API endpoints**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/jobs" -Method Get
```

**Monitor logs**
```powershell
npm run logs
```

## Troubleshooting

### PowerShell Execution Policy Error

If you get an execution policy error, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser
```

Then run the deployment script:
```powershell
.\scripts\deploy-firestore.ps1 -Environment staging -DryRun
```

### npm Commands Not Found

Ensure Node.js is installed and in PATH:
```powershell
node --version
npm --version
```

### Git Commands Not Found

Ensure Git for Windows is installed and in PATH:
```powershell
git --version
```

### Firebase CLI Not Found

Install Firebase CLI globally:
```powershell
npm install -g firebase-tools
```

### Build Fails

Clear cache and rebuild:
```powershell
Remove-Item -Recurse -Force .next
npm run build
```

## Environment Variables on Windows

### Set Environment Variables Temporarily

```powershell
$env:FIREBASE_PROJECT_ID = "your-project-id"
$env:FIREBASE_SERVICE_ACCOUNT_KEY = '{"type":"service_account",...}'
```

### Set Environment Variables Permanently

1. Open Environment Variables:
   - Press `Win + X` and select "System"
   - Click "Advanced system settings"
   - Click "Environment Variables"

2. Add new variables:
   - Click "New" under "User variables"
   - Variable name: `FIREBASE_PROJECT_ID`
   - Variable value: `your-project-id`
   - Click "OK"

3. Repeat for other variables

4. Restart PowerShell for changes to take effect

## Running Tests on Windows

### Unit Tests
```powershell
npm run test
```

### Integration Tests
```powershell
npm run test:integration
```

### E2E Tests
```powershell
npm run test:e2e
```

### All Tests
```powershell
npm run test; npm run test:integration; npm run test:e2e
```

## Monitoring on Windows

### View Application Logs

```powershell
npm run logs
```

### Monitor Firestore Operations

```powershell
# Open Firebase Console in browser
Start-Process "https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore"
```

### Check Firestore Indexes

```powershell
firebase firestore:indexes:list
```

## Rollback on Windows

### Revert to Previous Version

```powershell
git log --oneline -5
git revert <commit-hash>
git push origin main
```

### Switch Back to PostgreSQL

1. Update `.env` file with PostgreSQL variables
2. Restart application
3. Verify PostgreSQL connection

## PowerShell Tips

### Create Alias for Deployment Script

```powershell
Set-Alias deploy-firestore "powershell -ExecutionPolicy Bypass -File scripts/deploy-firestore.ps1"
```

### Run Script in Background

```powershell
Start-Job -ScriptBlock { powershell -ExecutionPolicy Bypass -File scripts/deploy-firestore.ps1 -Environment staging }
```

### View Job Status

```powershell
Get-Job
Receive-Job -Id 1
```

## Windows Task Scheduler

### Schedule Automated Deployment

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., daily at 2 AM)
4. Set action:
   - Program: `powershell.exe`
   - Arguments: `-ExecutionPolicy Bypass -File "D:\Finbers-Link\scripts\deploy-firestore.ps1" -Environment staging`

## Common Windows Issues

### Long Path Names

If you get "path too long" errors:
```powershell
# Enable long paths in Windows 10/11
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

### Line Ending Issues

If you get line ending errors:
```powershell
# Configure Git to handle line endings
git config --global core.autocrlf true
```

### Slow npm Install

Use npm cache clean:
```powershell
npm cache clean --force
npm install
```

## Performance Tips

### Use npm ci Instead of npm install

For faster, more reliable installs:
```powershell
npm ci
```

### Parallel Test Execution

```powershell
npm run test -- --maxWorkers=4
```

### Build Optimization

```powershell
npm run build -- --profile
```

## Support

For issues specific to Windows deployment:
1. Check this guide
2. Review `docs/PRODUCTION_DEPLOYMENT_GUIDE.md`
3. Check `docs/FIRESTORE_TESTING_GUIDE.md`
4. Review application logs

## Checklist

- [ ] PowerShell 5.0+ installed
- [ ] Node.js 18+ installed
- [ ] Git for Windows installed
- [ ] Firebase CLI installed
- [ ] .env file configured
- [ ] Prisma dependencies removed
- [ ] Deployment script tested (dry run)
- [ ] Data migration script ready
- [ ] Tests passing
- [ ] Ready for production deployment

## Next Steps

1. Run deployment script in dry-run mode
2. Review output and verify all checks pass
3. Execute data migration
4. Run full test suite
5. Deploy to staging
6. Deploy to production

## Conclusion

The PowerShell deployment script provides a Windows-native way to deploy the Firestore migration. Follow this guide for smooth deployment on Windows systems.

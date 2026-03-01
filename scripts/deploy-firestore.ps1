# Firestore Migration Deployment Script (PowerShell)
# This script automates the deployment process for Firestore migration

param(
    [string]$Environment = "staging",
    [switch]$DryRun = $false
)

# Colors for output
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"

Write-Host "=== Firestore Migration Deployment ===" -ForegroundColor $Yellow
Write-Host "Environment: $Environment"
Write-Host "Dry Run: $DryRun"
Write-Host ""

# Function to print status
function Print-Status {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $Green
}

function Print-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $Red
}

function Print-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor $Yellow
}

# Step 1: Pre-deployment checks
Write-Host "Step 1: Pre-deployment Checks" -ForegroundColor $Yellow

if (-not (Test-Path ".env")) {
    Print-Error ".env file not found"
    exit 1
}
Print-Status ".env file exists"

if (-not (Test-Path "package.json")) {
    Print-Error "package.json not found"
    exit 1
}
Print-Status "package.json exists"

$packageContent = Get-Content "package.json" -Raw
if ($packageContent -match "@prisma/client") {
    Print-Error "Prisma dependencies still in package.json"
    exit 1
}
Print-Status "Prisma dependencies removed"

# Step 2: Install dependencies
Write-Host ""
Write-Host "Step 2: Installing Dependencies" -ForegroundColor $Yellow
if (-not $DryRun) {
    npm install
    Print-Status "Dependencies installed"
} else {
    Print-Warning "Skipping npm install (dry run)"
}

# Step 3: Build application
Write-Host ""
Write-Host "Step 3: Building Application" -ForegroundColor $Yellow
if (-not $DryRun) {
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Print-Status "Application built successfully"
    } else {
        Print-Error "Build failed"
        exit 1
    }
} else {
    Print-Warning "Skipping build (dry run)"
}

# Step 4: Run linting
Write-Host ""
Write-Host "Step 4: Running Linter" -ForegroundColor $Yellow
if (-not $DryRun) {
    npm run lint
    Print-Status "Linting completed"
} else {
    Print-Warning "Skipping linting (dry run)"
}

# Step 5: Data migration
Write-Host ""
Write-Host "Step 5: Data Migration" -ForegroundColor $Yellow
if ($Environment -eq "staging" -or $Environment -eq "production") {
    if (-not $DryRun) {
        Print-Warning "Data migration requires manual execution"
        Write-Host "Run: npx ts-node scripts/migrate-to-firestore.ts"
    } else {
        Print-Warning "Skipping data migration (dry run)"
    }
}

# Step 6: Validate data
Write-Host ""
Write-Host "Step 6: Data Validation" -ForegroundColor $Yellow
if (-not $DryRun) {
    Print-Warning "Data validation requires manual execution"
    Write-Host "Run: npx ts-node scripts/validate-migration.ts"
} else {
    Print-Warning "Skipping validation (dry run)"
}

# Step 7: Deploy to environment
Write-Host ""
Write-Host "Step 7: Deploying to $Environment" -ForegroundColor $Yellow
if (-not $DryRun) {
    switch ($Environment) {
        "staging" {
            Print-Warning "Deploy to staging environment"
            Write-Host "Run: git push staging main"
        }
        "production" {
            Print-Warning "Deploy to production environment"
            Write-Host "Run: git push origin main"
        }
        default {
            Print-Error "Unknown environment: $Environment"
            exit 1
        }
    }
} else {
    Print-Warning "Skipping deployment (dry run)"
}

# Step 8: Post-deployment verification
Write-Host ""
Write-Host "Step 8: Post-deployment Verification" -ForegroundColor $Yellow
if (-not $DryRun) {
    Print-Warning "Verify deployment manually:"
    Write-Host "1. Check application health: curl http://localhost:3000/health"
    Write-Host "2. Verify Firestore connection"
    Write-Host "3. Run smoke tests"
    Write-Host "4. Monitor logs for errors"
} else {
    Print-Warning "Skipping verification (dry run)"
}

Write-Host ""
Write-Host "=== Deployment Script Completed ===" -ForegroundColor $Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Review deployment checklist: docs/DEPLOYMENT_CHECKLIST_FIRESTORE.md"
Write-Host "2. Execute data migration: npx ts-node scripts/migrate-to-firestore.ts"
Write-Host "3. Validate data: npx ts-node scripts/validate-migration.ts"
Write-Host "4. Run tests: npm run test; npm run test:e2e"
Write-Host "5. Deploy to production when ready"

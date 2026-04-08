#!/bin/bash

# Firestore Migration Deployment Script
# This script automates the deployment process for Firestore migration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
DRY_RUN=${2:-false}

echo -e "${YELLOW}=== Firestore Migration Deployment ===${NC}"
echo "Environment: $ENVIRONMENT"
echo "Dry Run: $DRY_RUN"
echo ""

# Function to print status
print_status() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# Step 1: Pre-deployment checks
echo -e "${YELLOW}Step 1: Pre-deployment Checks${NC}"

if [ ! -f ".env" ]; then
  print_error ".env file not found"
  exit 1
fi
print_status ".env file exists"

if [ ! -f "package.json" ]; then
  print_error "package.json not found"
  exit 1
fi
print_status "package.json exists"

if grep -q "@prisma/client" package.json; then
  print_error "Prisma dependencies still in package.json"
  exit 1
fi
print_status "Prisma dependencies removed"

# Step 2: Install dependencies
echo ""
echo -e "${YELLOW}Step 2: Installing Dependencies${NC}"
if [ "$DRY_RUN" != "true" ]; then
  npm install
  print_status "Dependencies installed"
else
  print_warning "Skipping npm install (dry run)"
fi

# Step 3: Build application
echo ""
echo -e "${YELLOW}Step 3: Building Application${NC}"
if [ "$DRY_RUN" != "true" ]; then
  npm run build
  print_status "Application built successfully"
else
  print_warning "Skipping build (dry run)"
fi

# Step 4: Run linting
echo ""
echo -e "${YELLOW}Step 4: Running Linter${NC}"
if [ "$DRY_RUN" != "true" ]; then
  npm run lint || print_warning "Linting issues found (non-critical)"
  print_status "Linting completed"
else
  print_warning "Skipping linting (dry run)"
fi

# Step 5: Data migration
echo ""
echo -e "${YELLOW}Step 5: Data Migration${NC}"
if [ "$ENVIRONMENT" = "staging" ] || [ "$ENVIRONMENT" = "production" ]; then
  if [ "$DRY_RUN" != "true" ]; then
    print_warning "Data migration requires manual execution"
    echo "Run: npx ts-node scripts/migrate-to-firestore.ts"
  else
    print_warning "Skipping data migration (dry run)"
  fi
fi

# Step 6: Validate data
echo ""
echo -e "${YELLOW}Step 6: Data Validation${NC}"
if [ "$DRY_RUN" != "true" ]; then
  print_warning "Data validation requires manual execution"
  echo "Run: npx ts-node scripts/validate-migration.ts"
else
  print_warning "Skipping validation (dry run)"
fi

# Step 7: Deploy to environment
echo ""
echo -e "${YELLOW}Step 7: Deploying to $ENVIRONMENT${NC}"
if [ "$DRY_RUN" != "true" ]; then
  case $ENVIRONMENT in
    staging)
      print_warning "Deploy to staging environment"
      echo "Run: git push staging main"
      ;;
    production)
      print_warning "Deploy to production environment"
      echo "Run: git push origin main"
      ;;
    *)
      print_error "Unknown environment: $ENVIRONMENT"
      exit 1
      ;;
  esac
else
  print_warning "Skipping deployment (dry run)"
fi

# Step 8: Post-deployment verification
echo ""
echo -e "${YELLOW}Step 8: Post-deployment Verification${NC}"
if [ "$DRY_RUN" != "true" ]; then
  print_warning "Verify deployment manually:"
  echo "1. Check application health: curl http://localhost:3000/health"
  echo "2. Verify Firestore connection"
  echo "3. Run smoke tests"
  echo "4. Monitor logs for errors"
else
  print_warning "Skipping verification (dry run)"
fi

echo ""
echo -e "${GREEN}=== Deployment Script Completed ===${NC}"
echo ""
echo "Next steps:"
echo "1. Review deployment checklist: docs/DEPLOYMENT_CHECKLIST_FIRESTORE.md"
echo "2. Execute data migration: npx ts-node scripts/migrate-to-firestore.ts"
echo "3. Validate data: npx ts-node scripts/validate-migration.ts"
echo "4. Run tests: npm run test && npm run test:e2e"
echo "5. Deploy to production when ready"

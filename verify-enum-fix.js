#!/usr/bin/env node

/**
 * Verification Script for PostgreSQL Enum Comparison Fix
 * 
 * This script verifies that all the required changes have been made
 * to fix the PostgreSQL enum comparison bug.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 PostgreSQL Enum Comparison Fix - Code Verification');
console.log('======================================================\n');

const filesToCheck = [
  {
    path: 'src/app/api/dashboard/courses/learning-pathway/route.ts',
    mustHave: [
      { pattern: /import.*EnrollmentStatus.*from.*@prisma\/client/, desc: 'Import EnrollmentStatus' },
      { pattern: /status:\s*EnrollmentStatus\.ACTIVE/, desc: 'Use EnrollmentStatus.ACTIVE (not string literal)' },
    ],
    mustNotHave: [
      { pattern: /status:\s*["\']ACTIVE["\']/, desc: 'String literal "ACTIVE" (should use enum)' },
    ],
  },
  {
    path: 'src/features/dashboard/service.ts',
    mustHave: [
      { pattern: /import.*EnrollmentStatus.*from.*@prisma\/client/, desc: 'Import EnrollmentStatus' },
      { pattern: /EnrollmentStatus\.\w+/, desc: 'Use EnrollmentStatus enum reference' },
    ],
    mustNotHave: [
      { pattern: /status:\s*["\']ACTIVE["\']/, desc: 'String literal "ACTIVE"' },
    ],
  },
  {
    path: 'src/features/admin/service.ts',
    mustHave: [
      { pattern: /UserStatus/, desc: 'Import UserStatus' },
      { pattern: /EnrollmentStatus/, desc: 'Import EnrollmentStatus' },
      { pattern: /status:\s*UserStatus\.ACTIVE/, desc: 'Use UserStatus.ACTIVE' },
    ],
    mustNotHave: [
      { pattern: /status:\s*["\']ACTIVE["\']/, desc: 'String literal "ACTIVE"' },
      { pattern: /status:\s*["\']SUSPENDED["\']/, desc: 'String literal "SUSPENDED"' },
    ],
  },
  {
    path: 'src/features/dashboard/insights.ts',
    mustHave: [
      { pattern: /import.*UserStatus.*from.*@prisma\/client/, desc: 'Import UserStatus' },
      { pattern: /status:\s*UserStatus\.ACTIVE/, desc: 'Use UserStatus.ACTIVE' },
    ],
    mustNotHave: [
      { pattern: /status:\s*["\']ACTIVE["\']/, desc: 'String literal "ACTIVE"' },
    ],
  },
  {
    path: 'src/features/superadmin/dashboard.ts',
    mustHave: [
      { pattern: /import.*TenantStatus.*from.*@prisma\/client/, desc: 'Import TenantStatus' },
      { pattern: /status:\s*TenantStatus\.ACTIVE/, desc: 'Use TenantStatus.ACTIVE' },
      { pattern: /status:\s*TenantStatus\.SUSPENDED/, desc: 'Use TenantStatus.SUSPENDED' },
    ],
    mustNotHave: [
      { pattern: /status:\s*["\']ACTIVE["\']/, desc: 'String literal "ACTIVE"' },
      { pattern: /status:\s*["\']SUSPENDED["\']/, desc: 'String literal "SUSPENDED"' },
    ],
  },
];

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

filesToCheck.forEach((file) => {
  console.log(`📄 Checking: ${file.path}`);
  console.log('─'.repeat(60));

  try {
    const content = fs.readFileSync(file.path, 'utf8');

    // Check for required patterns
    if (file.mustHave) {
      file.mustHave.forEach((check) => {
        totalChecks++;
        if (check.pattern.test(content)) {
          console.log(`  ✓ ${check.desc}`);
          passedChecks++;
        } else {
          console.log(`  ✗ ${check.desc}`);
          failedChecks++;
        }
      });
    }

    // Check for patterns that should NOT exist
    if (file.mustNotHave) {
      file.mustNotHave.forEach((check) => {
        totalChecks++;
        if (!check.pattern.test(content)) {
          console.log(`  ✓ No ${check.desc}`);
          passedChecks++;
        } else {
          console.log(`  ✗ Found ${check.desc} (should be removed)`);
          failedChecks++;
        }
      });
    }
  } catch (error) {
    console.log(`  ✗ File not found or cannot be read: ${error.message}`);
    failedChecks += (file.mustHave?.length || 0) + (file.mustNotHave?.length || 0);
    totalChecks += (file.mustHave?.length || 0) + (file.mustNotHave?.length || 0);
  }

  console.log();
});

// Summary
console.log('📊 Verification Summary');
console.log('======================');
console.log(`Total Checks: ${totalChecks}`);
console.log(`Passed: ${passedChecks} ✓`);
console.log(`Failed: ${failedChecks} ✗`);
console.log();

if (failedChecks === 0) {
  console.log('🎉 All checks passed! The enum comparison fix is correctly applied.');
  console.log('\n✅ Ready to deploy!');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please review the changes above.');
  process.exit(1);
}

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of critical files that should exist
const criticalFiles = [
  'src/lib/prisma.ts',
  'src/lib/auth/guards.ts',
  'src/lib/auth/session.ts',
  'src/lib/auth/jwt.ts',
  'src/lib/security/rate-limit.ts',
  'src/lib/utils.ts',
  'src/config/site.ts',
  'src/components/ui/button.tsx',
  'src/components/ui/card.tsx',
  'src/components/ui/input.tsx',
  'src/components/ui/badge.tsx',
  'src/components/ui/dialog.tsx',
  'src/components/ui/textarea.tsx',
  'src/components/ui/stat-card.tsx',
  'src/components/ui/glass-card.tsx',
  'src/components/ui/glass-card-error.tsx',
  'src/hooks/useSocket.ts',
  'src/hooks/use-toast.ts',
  'src/components/ai/bullet-suggestions.tsx',
  'src/components/ai/skill-analysis.tsx',
  'src/components/chat/chat-avatar.tsx',
  'src/components/notifications/notifications-bell.tsx',
  'src/components/current-user-provider.tsx',
  'src/features/admin/service.ts',
  'src/features/auth/service.ts',
  'src/features/chat/service.ts',
  'src/features/resume/service.ts',
  'src/features/dashboard/service.ts',
];

console.log('Checking critical files...\n');

let missing = [];
let found = [];

criticalFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    found.push(file);
    console.log(`✓ ${file}`);
  } else {
    missing.push(file);
    console.log(`✗ ${file}`);
  }
});

console.log(`\n\nSummary:`);
console.log(`Found: ${found.length}/${criticalFiles.length}`);
console.log(`Missing: ${missing.length}/${criticalFiles.length}`);

if (missing.length > 0) {
  console.log(`\nMissing files:`);
  missing.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
} else {
  console.log(`\nAll critical files exist!`);
  process.exit(0);
}

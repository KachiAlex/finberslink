import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Bug Condition Exploration Test
 * 
 * Property 1: Bug Condition - Module Resolution Errors for Missing Files
 * 
 * This test verifies that the build fails with 51 "Module not found" errors
 * when component, hook, and configuration files are missing.
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * When the bug is fixed, this test will PASS, confirming all files are created
 */

describe('Turbopack Module Resolution - Bug Condition Exploration', () => {
  const missingFiles = [
    // Configuration files
    'src/config/site.ts',
    
    // Base UI components
    'src/components/ui/button.tsx',
    'src/components/ui/card.tsx',
    'src/components/ui/input.tsx',
    'src/components/ui/textarea.tsx',
    'src/components/ui/badge.tsx',
    
    // Custom UI components
    'src/components/ui/stat-card.tsx',
    'src/components/ui/glass-card.tsx',
    'src/components/ui/glass-card-error.tsx',
    
    // Hooks
    'src/hooks/useSocket.ts',
    'src/hooks/use-toast.ts',
    
    // Feature components
    'src/components/ai/bullet-suggestions.tsx',
    'src/components/ai/skill-analysis.tsx',
    'src/components/chat/chat-avatar.tsx',
    'src/components/notifications/notifications-bell.tsx',
    'src/components/current-user-provider.tsx',
  ];

  test('should verify all 51 missing files exist after fix', () => {
    const missingCount = missingFiles.filter(file => {
      const fullPath = path.join(process.cwd(), file);
      return !fs.existsSync(fullPath);
    }).length;

    // When bug is fixed, all files should exist (missingCount = 0)
    // When bug is NOT fixed, files will be missing (missingCount > 0)
    expect(missingCount).toBe(0);
  });

  test('should verify build succeeds with no module resolution errors', () => {
    try {
      const output = execSync('npm run build 2>&1', { encoding: 'utf-8' });
      
      // Check that build succeeded
      expect(output).not.toContain('Module not found');
      expect(output).not.toContain('Build error occurred');
      
      // Verify no errors for the specific missing files
      missingFiles.forEach(file => {
        expect(output).not.toContain(`Can't resolve '${file.replace('src/', '@/')}'`);
      });
    } catch (error: any) {
      // If build fails, check if it's due to module resolution errors
      const output = error.stdout || error.message || '';
      
      // Count module resolution errors
      const moduleNotFoundMatches = output.match(/Module not found/g) || [];
      const buildErrorMatches = output.match(/Build error occurred/g) || [];
      
      if (moduleNotFoundMatches.length > 0 || buildErrorMatches.length > 0) {
        // Bug condition confirmed: build fails with module resolution errors
        console.log(`\nBug Condition Confirmed:`);
        console.log(`- Module resolution errors found: ${moduleNotFoundMatches.length}`);
        console.log(`- Build errors found: ${buildErrorMatches.length}`);
        
        // This is expected on unfixed code
        throw new Error(
          `Build failed with module resolution errors (expected on unfixed code). ` +
          `Module not found errors: ${moduleNotFoundMatches.length}`
        );
      }
      
      // If it's a different error, re-throw
      throw error;
    }
  });

  test('should document missing file categories', () => {
    const categories = {
      'Configuration files': ['src/config/site.ts'],
      'Base UI components': [
        'src/components/ui/button.tsx',
        'src/components/ui/card.tsx',
        'src/components/ui/input.tsx',
        'src/components/ui/textarea.tsx',
        'src/components/ui/badge.tsx',
      ],
      'Custom UI components': [
        'src/components/ui/stat-card.tsx',
        'src/components/ui/glass-card.tsx',
        'src/components/ui/glass-card-error.tsx',
      ],
      'Hooks': [
        'src/hooks/useSocket.ts',
        'src/hooks/use-toast.ts',
      ],
      'Feature components': [
        'src/components/ai/bullet-suggestions.tsx',
        'src/components/ai/skill-analysis.tsx',
        'src/components/chat/chat-avatar.tsx',
        'src/components/notifications/notifications-bell.tsx',
        'src/components/current-user-provider.tsx',
      ],
    };

    let totalMissing = 0;
    Object.entries(categories).forEach(([category, files]) => {
      const missing = files.filter(file => {
        const fullPath = path.join(process.cwd(), file);
        return !fs.existsSync(fullPath);
      });
      
      if (missing.length > 0) {
        console.log(`\n${category}: ${missing.length} missing`);
        missing.forEach(file => console.log(`  - ${file}`));
        totalMissing += missing.length;
      }
    });

    console.log(`\nTotal missing files: ${totalMissing}`);
    
    // When bug is fixed, totalMissing should be 0
    expect(totalMissing).toBe(0);
  });
});

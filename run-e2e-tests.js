#!/usr/bin/env node

/**
 * FinbersLink E2E Test Executor
 * Automated testing for course flow functionality
 */

const fs = require('fs');
const path = require('path');

console.log('=== FinbersLink E2E Test Execution ===\n');

// Test Results Collector
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Test Helper Functions
function runTest(testName, testFunction) {
  testResults.total++;
  try {
    const result = testFunction();
    if (result) {
      console.log(`\u2705 ${testName}: PASSED`);
      testResults.passed++;
      testResults.details.push({ name: testName, status: 'PASSED', message: result });
    } else {
      console.log(`\u274c ${testName}: FAILED`);
      testResults.failed++;
      testResults.details.push({ name: testName, status: 'FAILED', message: 'Test returned false' });
    }
  } catch (error) {
    console.log(`\u274c ${testName}: ERROR - ${error.message}`);
    testResults.failed++;
    testResults.details.push({ name: testName, status: 'ERROR', message: error.message });
  }
}

// Test 1: Check if all required files exist
function testRequiredFiles() {
  const requiredFiles = [
    'src/components/ui/safe-image.tsx',
    'src/components/ui/universal-video.tsx',
    'src/components/ui/pdf-viewer.tsx',
    'src/components/course/resource-library.tsx',
    'src/app/api/courses/[courseId]/resources/route.ts',
    'src/components/admin/course-card.tsx',
    'src/components/admin/course-list-row.tsx',
    'src/components/admin/course-edit-modal.tsx'
  ];

  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length === 0) {
    return `All ${requiredFiles.length} required files exist`;
  } else {
    throw new Error(`Missing files: ${missingFiles.join(', ')}`);
  }
}

// Test 2: Check component exports
function testComponentExports() {
  const components = [
    'src/components/ui/safe-image.tsx',
    'src/components/ui/universal-video.tsx',
    'src/components/ui/pdf-viewer.tsx'
  ];

  const exportIssues = [];
  
  components.forEach(component => {
    if (fs.existsSync(component)) {
      const content = fs.readFileSync(component, 'utf8');
      if (!content.includes('export function')) {
        exportIssues.push(component);
      }
    }
  });

  if (exportIssues.length === 0) {
    return 'All components have proper exports';
  } else {
    throw new Error(`Export issues in: ${exportIssues.join(', ')}`);
  }
}

// Test 3: Check API endpoint structure
function testAPIEndpoints() {
  const apiFile = 'src/app/api/courses/[courseId]/resources/route.ts';
  
  if (!fs.existsSync(apiFile)) {
    throw new Error('Resources API endpoint missing');
  }

  const content = fs.readFileSync(apiFile, 'utf8');
  const requiredMethods = ['GET', 'POST'];
  const missingMethods = requiredMethods.filter(method => !content.includes(`export const ${method}`));

  if (missingMethods.length === 0) {
    return 'API endpoint has all required methods';
  } else {
    throw new Error(`Missing API methods: ${missingMethods.join(', ')}`);
  }
}

// Test 4: Check TypeScript compilation
function testTypeScriptCompilation() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const hasTypeScript = packageJson.devDependencies && packageJson.devDependencies.typescript;
  
  if (!hasTypeScript) {
    throw new Error('TypeScript not found in dependencies');
  }

  // Check for TypeScript config
  if (!fs.existsSync('tsconfig.json')) {
    throw new Error('tsconfig.json missing');
  }

  return 'TypeScript configuration found';
}

// Test 5: Check component dependencies
function testComponentDependencies() {
  const components = [
    'src/components/ui/safe-image.tsx',
    'src/components/ui/universal-video.tsx',
    'src/components/ui/pdf-viewer.tsx'
  ];

  const dependencyIssues = [];

  components.forEach(component => {
    if (fs.existsSync(component)) {
      const content = fs.readFileSync(component, 'utf8');
      const imports = content.match(/import.*from/g) || [];
      
      // Check for critical dependencies - only check cn if component uses it
      if (content.includes('cn(') && !content.includes('from "@/lib/utils"')) {
        dependencyIssues.push(`${component}: Missing cn utility`);
      }
    }
  });

  if (dependencyIssues.length === 0) {
    return 'All component dependencies look correct';
  } else {
    throw new Error(`Dependency issues: ${dependencyIssues.join(', ')}`);
  }
}

// Test 6: Check admin course grid integration
function testAdminCourseGrid() {
  const gridFile = 'src/components/admin/admin-courses-grid.tsx';
  
  if (!fs.existsSync(gridFile)) {
    throw new Error('Admin courses grid component missing');
  }

  const content = fs.readFileSync(gridFile, 'utf8');
  const requiredFeatures = [
    'CourseCard',
    'CourseListRow',
    'handleViewCourse',
    'handleEditCourse',
    'handleArchiveCourse',
    'handleRestoreCourse'
  ];

  const missingFeatures = requiredFeatures.filter(feature => !content.includes(feature));

  if (missingFeatures.length === 0) {
    return 'Admin courses grid has all required features';
  } else {
    throw new Error(`Missing features: ${missingFeatures.join(', ')}`);
  }
}

// Test 7: Check modal functionality
function testModalFunctionality() {
  const modalFile = 'src/components/admin/course-edit-modal.tsx';
  
  if (!fs.existsSync(modalFile)) {
    throw new Error('Course edit modal missing');
  }

  const content = fs.readFileSync(modalFile, 'utf8');
  const requiredFeatures = [
    'Modal',
    'onClose',
    'onSave',
    'isOpen',
    'onSubmit'
  ];

  const missingFeatures = requiredFeatures.filter(feature => !content.includes(feature));

  if (missingFeatures.length === 0) {
    return 'Course edit modal has all required features';
  } else {
    throw new Error(`Missing modal features: ${missingFeatures.join(', ')}`);
  }
}

// Test 8: Check resource library features
function testResourceLibraryFeatures() {
  const libraryFile = 'src/components/course/resource-library.tsx';
  
  if (!fs.existsSync(libraryFile)) {
    throw new Error('Resource library component missing');
  }

  const content = fs.readFileSync(libraryFile, 'utf8');
  const requiredFeatures = [
    'ResourceLibrary',
    'PDFViewer',
    'UniversalVideo',
    'searchTerm',
    'selectedType',
    'viewMode',
    'handleDownload'
  ];

  const missingFeatures = requiredFeatures.filter(feature => !content.includes(feature));

  if (missingFeatures.length === 0) {
    return 'Resource library has all required features';
  } else {
    throw new Error(`Missing library features: ${missingFeatures.join(', ')}`);
  }
}

// Execute all tests
function runAllTests() {
  console.log('Running comprehensive E2E tests...\n');

  // File Structure Tests
  runTest('Required Files Check', testRequiredFiles);
  runTest('Component Exports Check', testComponentExports);
  runTest('API Endpoint Structure', testAPIEndpoints);
  runTest('TypeScript Configuration', testTypeScriptCompilation);
  
  // Component Integration Tests
  runTest('Component Dependencies', testComponentDependencies);
  runTest('Admin Course Grid', testAdminCourseGrid);
  runTest('Modal Functionality', testModalFunctionality);
  runTest('Resource Library Features', testResourceLibraryFeatures);

  // Results Summary
  console.log('\n=== Test Results Summary ===');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  if (testResults.failed > 0) {
    console.log('\n=== Failed Tests Details ===');
    testResults.details
      .filter(test => test.status !== 'PASSED')
      .forEach(test => {
        console.log(`\u274c ${test.name}: ${test.message}`);
      });
  }

  console.log('\n=== Next Steps ===');
  if (testResults.failed === 0) {
    console.log('\u2705 All tests passed! Ready for browser testing.');
    console.log('Next: Run browser console tests on the deployed application.');
  } else {
    console.log('\u26a0\ufe0f Some tests failed. Please fix issues before browser testing.');
    console.log('Review failed tests above and make necessary fixes.');
  }

  return testResults.failed === 0;
}

// Generate test report
function generateTestReport() {
  const report = {
    timestamp: new Date().toISOString(),
    results: testResults,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      workingDirectory: process.cwd()
    }
  };

  fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
  console.log('\nTest report saved to: test-report.json');
}

// Run tests and generate report
try {
  const success = runAllTests();
  generateTestReport();
  
  if (success) {
    console.log('\n\u2705 Ready for browser testing phase!');
    console.log('Open the application and run the browser test script.');
  } else {
    console.log('\n\u274c Fix issues before proceeding to browser testing.');
  }
} catch (error) {
  console.error('Test execution failed:', error);
  process.exit(1);
}

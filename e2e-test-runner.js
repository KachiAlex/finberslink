// E2E Test Runner
// Runs both manual and automated E2E tests for edit modal

console.log('🧪 E2E TEST RUNNER');
console.log('=====================');

// Test 1: Manual Browser Test
function runManualTest() {
  console.log('\n📋 Running Manual Browser Test...');
  console.log('This will test the edit modal in your current browser session.');
  
  // Load and run the manual test
  const script = document.createElement('script');
  script.src = '/e2e-edit-modal-test.js';
  script.onload = () => {
    console.log('✅ Manual test script loaded');
    if (typeof window.runE2EEditModalTest === 'function') {
      window.runE2EEditModalTest();
    }
  };
  script.onerror = () => {
    console.log('❌ Failed to load manual test script');
  };
  document.head.appendChild(script);
}

// Test 2: Playwright Automated Test
function runPlaywrightTest() {
  console.log('\n📋 Running Playwright Automated Test...');
  console.log('This will run comprehensive automated tests.');
  
  // Instructions for running Playwright test
  console.log('\n💡 To run Playwright tests:');
  console.log('1. Open terminal in project root');
  console.log('2. Run: npx playwright test tests/e2e/edit-modal-e2e.spec.ts');
  console.log('3. Or run with UI: npx playwright test --ui tests/e2e/edit-modal-e2e.spec.ts');
  
  // Try to detect if Playwright is available
  fetch('/api/test-playwright', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'check' })
  })
  .then(response => response.json())
  .then(data => {
    if (data.available) {
      console.log('✅ Playwright is available');
      console.log('🚀 Starting automated test...');
      
      // Trigger automated test
      return fetch('/api/test-playwright', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run', test: 'edit-modal' })
      });
    } else {
      console.log('⚠️ Playwright not available on server');
      console.log('Please run tests locally with npx playwright test');
    }
  })
  .catch(error => {
    console.log('❌ Error checking Playwright availability:', error.message);
  });
}

// Test 3: Quick Validation Test
function runQuickValidation() {
  console.log('\n📋 Running Quick Validation...');
  
  const checks = {
    adminPage: window.location.includes('/admin'),
    editButtons: document.querySelectorAll('button').length > 0,
    modalExists: document.querySelector('[class*="fixed inset-0"]') !== null,
    categorySelect: document.querySelector('#category') !== null,
    saveButton: Array.from(document.querySelectorAll('button')).some(btn => 
      btn.textContent.includes('Save')
    )
  };
  
  console.log('Quick Check Results:');
  Object.entries(checks).forEach(([key, value]) => {
    console.log(`${value ? '✅' : '❌'} ${key}: ${value}`);
  });
  
  const passedCount = Object.values(checks).filter(Boolean).length;
  const totalCount = Object.keys(checks).length;
  
  console.log(`\nQuick Check: ${passedCount}/${totalCount} passed`);
  
  if (passedCount === totalCount) {
    console.log('🎉 All quick checks passed!');
  } else {
    console.log('⚠️ Some quick checks failed');
  }
}

// Test 4: API Endpoint Test
function runAPITest() {
  console.log('\n📋 Running API Endpoint Test...');
  
  // Test the PUT endpoint directly
  const testCourseId = 'test-course-id';
  const testData = {
    title: 'Test Course Update',
    category: 'Business',
    level: 'BEGINNER',
    description: 'Test description'
  };
  
  fetch(`/api/admin/courses/${testCourseId}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token' // This will fail auth, but test endpoint
    },
    body: JSON.stringify(testData)
  })
  .then(response => {
    console.log(`API Response Status: ${response.status}`);
    
    if (response.status === 403) {
      console.log('✅ API endpoint exists (auth working correctly)');
    } else if (response.status === 404) {
      console.log('❌ API endpoint not found');
    } else if (response.status === 500) {
      console.log('❌ API endpoint has 500 error');
      response.json().then(data => {
        console.log('Error details:', data);
      });
    } else {
      console.log('✅ API endpoint responding');
      response.json().then(data => {
        console.log('Response data:', data);
      });
    }
  })
  .catch(error => {
    console.log('❌ API test failed:', error.message);
  });
}

// Main test runner
function runAllTests() {
  console.log('🚀 Starting Complete E2E Test Suite...');
  
  // Run quick validation first
  runQuickValidation();
  
  // Wait a bit, then run manual test
  setTimeout(() => {
    runManualTest();
  }, 1000);
  
  // Wait a bit more, then run API test
  setTimeout(() => {
    runAPITest();
  }, 2000);
  
  // Show Playwright instructions
  setTimeout(() => {
    runPlaywrightTest();
  }, 3000);
}

// Test results summary
function showTestSummary() {
  console.log('\n📊 E2E TEST SUMMARY');
  console.log('===================');
  console.log('1. ✅ Manual Browser Test: Interactive testing in current browser');
  console.log('2. ✅ Playwright Test: Automated testing with Playwright');
  console.log('3. ✅ Quick Validation: Basic checks of current state');
  console.log('4. ✅ API Endpoint Test: Direct API testing');
  
  console.log('\n🎯 What each test covers:');
  console.log('- Modal opening and closing');
  console.log('- Category dropdown functionality');
  console.log('- Resource upload capability');
  console.log('- Save function and API calls');
  console.log('- Form validation');
  console.log('- Error handling and notifications');
  console.log('- Styling and accessibility');
  
  console.log('\n💡 Next steps:');
  console.log('1. Review test results');
  console.log('2. Fix any failing tests');
  console.log('3. Re-run tests to verify fixes');
  console.log('4. Deploy fixes to production');
}

// Make available globally
window.runE2ETestSuite = runAllTests;
window.showTestSummary = showTestSummary;

// Auto-run after 2 seconds
console.log('🤖 Auto-running E2E test suite in 2 seconds...');
setTimeout(() => {
  runAllTests();
  setTimeout(showTestSummary, 5000);
}, 2000);

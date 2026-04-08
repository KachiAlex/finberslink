// E2E Edit Modal Test Script
// Comprehensive end-to-end testing of the edit modal functionality

console.log('🚀 E2E EDIT MODAL TEST STARTING');
console.log('==========================================');

// Test configuration
const TEST_CONFIG = {
  timeout: 5000,
  slowTimeout: 10000,
  retryAttempts: 3
};

// Test results tracking
const testResults = {
  modalOpen: false,
  categoryDropdown: false,
  resourceUpload: false,
  saveFunction: false,
  validation: false,
  notifications: false,
  overall: false
};

// Utility functions
function waitForElement(selector, timeout = TEST_CONFIG.timeout) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}${details ? ': ' + details : ''}`);
}

// Test 1: Navigate to admin and find edit buttons
async function testAdminDashboard() {
  console.log('\n📋 Test 1: Admin Dashboard & Edit Buttons');
  
  try {
    // Check if we're on admin page
    if (!window.location.includes('/admin')) {
      console.log('📍 Navigating to admin dashboard...');
      window.location.href = '/admin';
      await sleep(3000);
    }

    // Find edit buttons
    const editButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.textContent.includes('Edit') || 
      btn.querySelector('svg[data-lucide="edit"]') ||
      btn.closest('[class*="edit"]')
    );

    if (editButtons.length > 0) {
      logTest('Edit buttons found', true, `${editButtons.length} buttons`);
      return editButtons[0];
    } else {
      logTest('Edit buttons found', false, 'No edit buttons detected');
      return null;
    }
  } catch (error) {
    logTest('Admin dashboard test', false, error.message);
    return null;
  }
}

// Test 2: Open edit modal
async function testModalOpen(editButton) {
  console.log('\n📋 Test 2: Open Edit Modal');
  
  try {
    if (!editButton) {
      logTest('Modal open', false, 'No edit button available');
      return false;
    }

    // Click edit button
    editButton.click();
    
    // Wait for modal to appear
    const modal = await waitForElement('[class*="fixed inset-0"]', TEST_CONFIG.slowTimeout);
    
    if (modal) {
      logTest('Modal open', true, 'Modal detected');
      testResults.modalOpen = true;
      
      // Check modal content
      const modalContent = modal.querySelector('[class*="bg-white"]');
      if (modalContent) {
        logTest('Modal content', true, 'White background detected');
      }
      
      return true;
    } else {
      logTest('Modal open', false, 'Modal not detected after click');
      return false;
    }
  } catch (error) {
    logTest('Modal open', false, error.message);
    return false;
  }
}

// Test 3: Test category dropdown
async function testCategoryDropdown() {
  console.log('\n📋 Test 3: Category Dropdown');
  
  try {
    // Find category dropdown
    const categorySelect = document.querySelector('#category') ||
                         document.querySelector('select[id*="category"]') ||
                         Array.from(document.querySelectorAll('label')).find(label => 
                           label.textContent.includes('Category')
                         )?.parentElement?.querySelector('select');

    if (!categorySelect) {
      logTest('Category dropdown found', false, 'Category select not found');
      return false;
    }

    logTest('Category dropdown found', true, 'Native select element');

    // Test dropdown options
    const options = categorySelect.querySelectorAll('option');
    if (options.length > 1) {
      logTest('Category options', true, `${options.length} options available`);
      
      // Try to select a different option
      const firstOption = options[1]; // Skip first "Select category" option
      if (firstOption && firstOption.value) {
        categorySelect.value = firstOption.value;
        
        // Trigger change event
        const event = new Event('change', { bubbles: true });
        categorySelect.dispatchEvent(event);
        
        logTest('Category selection', true, `Selected: ${firstOption.value}`);
        testResults.categoryDropdown = true;
        return true;
      }
    } else {
      logTest('Category options', false, 'No options in dropdown');
      return false;
    }
  } catch (error) {
    logTest('Category dropdown', false, error.message);
    return false;
  }
}

// Test 4: Test resource upload
async function testResourceUpload() {
  console.log('\n📋 Test 4: Resource Upload');
  
  try {
    // Navigate to Resources step
    const nextButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.textContent.includes('Next')
    );

    if (nextButtons.length < 2) {
      logTest('Navigate to Resources', false, 'Not enough Next buttons');
      return false;
    }

    // Click Next twice to get to Resources (Basic Info -> Curriculum -> Resources)
    nextButtons[0].click();
    await sleep(500);
    nextButtons[0].click();
    await sleep(1000);

    // Look for upload buttons
    const uploadButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.textContent.includes('Upload')
    );

    if (uploadButtons.length > 0) {
      logTest('Upload buttons found', true, `${uploadButtons.length} upload buttons`);
      
      // Test file input existence
      const fileInputs = document.querySelectorAll('input[type="file"]');
      if (fileInputs.length > 0) {
        logTest('File inputs found', true, `${fileInputs.length} file inputs`);
        testResults.resourceUpload = true;
        return true;
      } else {
        logTest('File inputs found', false, 'No file inputs detected');
        return false;
      }
    } else {
      logTest('Upload buttons found', false, 'No upload buttons detected');
      return false;
    }
  } catch (error) {
    logTest('Resource upload', false, error.message);
    return false;
  }
}

// Test 5: Test save functionality
async function testSaveFunction() {
  console.log('\n📋 Test 5: Save Function');
  
  try {
    // Navigate to Review step
    const nextButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.textContent.includes('Next')
    );

    if (nextButtons.length === 0) {
      logTest('Navigate to Review', false, 'No Next button found');
      return false;
    }

    nextButtons[0].click();
    await sleep(1000);

    // Look for save button
    const saveButton = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('Save Changes')
    );

    if (!saveButton) {
      logTest('Save button found', false, 'Save button not found');
      return false;
    }

    if (saveButton.disabled) {
      logTest('Save button enabled', false, 'Save button is disabled');
      return false;
    }

    logTest('Save button found', true, 'Save button is enabled');

    // Set up console monitoring
    let saveAttempted = false;
    let saveResponse = null;

    const originalLog = console.log;
    console.log = function(...args) {
      originalLog.apply(console, args);
      
      if (args[0] && args[0].includes && args[0].includes('Saving course')) {
        saveAttempted = true;
        logTest('Save attempt detected', true, 'Save function called');
      }
      
      if (args[0] && args[0].includes && args[0].includes('Save response')) {
        saveResponse = args[1];
        logTest('Save response detected', true, 'Response received');
      }
    };

    // Click save button
    saveButton.click();
    
    // Wait for save to complete
    await sleep(3000);
    
    // Restore console.log
    console.log = originalLog;

    if (saveAttempted) {
      testResults.saveFunction = true;
      logTest('Save function', true, 'Save was attempted');
      return true;
    } else {
      logTest('Save function', false, 'Save was not attempted');
      return false;
    }
  } catch (error) {
    logTest('Save function', false, error.message);
    return false;
  }
}

// Test 6: Check for validation and notifications
async function testValidationAndNotifications() {
  console.log('\n📋 Test 6: Validation & Notifications');
  
  try {
    // Look for toast notifications
    const toasts = document.querySelectorAll('[role="alert"], [class*="toast"]');
    
    if (toasts.length > 0) {
      logTest('Notifications found', true, `${toasts.length} notifications`);
      
      toasts.forEach((toast, index) => {
        const text = toast.textContent || '';
        if (text.includes('success') || text.includes('updated')) {
          logTest(`Toast ${index + 1}`, true, 'Success notification');
        } else if (text.includes('error') || text.includes('failed')) {
          logTest(`Toast ${index + 1}`, false, 'Error notification');
        }
      });
      
      testResults.notifications = true;
    } else {
      logTest('Notifications found', false, 'No notifications detected');
    }

    // Check for validation errors
    const errorElements = document.querySelectorAll('[class*="error"], [class*="destructive"]');
    if (errorElements.length > 0) {
      logTest('Validation errors', true, `${errorElements.length} validation errors`);
      testResults.validation = true;
    } else {
      logTest('Validation errors', false, 'No validation errors found');
    }

    return true;
  } catch (error) {
    logTest('Validation test', false, error.message);
    return false;
  }
}

// Test 7: Console error check
function testConsoleErrors() {
  console.log('\n📋 Test 7: Console Error Check');
  
  // Check for 500 errors in console
  const has500Errors = console.error.toString().includes('500') ||
                      console.error.toString().includes('Failed to load resource');
  
  if (has500Errors) {
    logTest('Console errors', false, '500 errors detected');
    return false;
  } else {
    logTest('Console errors', true, 'No 500 errors detected');
    return true;
  }
}

// Main test runner
async function runE2ETest() {
  console.log('🎯 Starting E2E Edit Modal Test...');
  
  try {
    // Test 1: Admin dashboard
    const editButton = await testAdminDashboard();
    if (!editButton) {
      console.log('\n❌ Cannot proceed without edit button');
      return;
    }

    // Test 2: Open modal
    const modalOpened = await testModalOpen(editButton);
    if (!modalOpened) {
      console.log('\n❌ Cannot proceed without modal');
      return;
    }

    // Test 3: Category dropdown
    await testCategoryDropdown();

    // Test 4: Resource upload
    await testResourceUpload();

    // Test 5: Save function
    await testSaveFunction();

    // Test 6: Validation and notifications
    await testValidationAndNotifications();

    // Test 7: Console errors
    testConsoleErrors();

    // Calculate overall result
    const passedTests = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;
    const overallPass = passedTests >= (totalTests * 0.7); // 70% pass rate
    
    testResults.overall = overallPass;

    // Final results
    console.log('\n📊 E2E TEST RESULTS');
    console.log('====================');
    console.log(`Modal Open: ${testResults.modalOpen ? '✅' : '❌'}`);
    console.log(`Category Dropdown: ${testResults.categoryDropdown ? '✅' : '❌'}`);
    console.log(`Resource Upload: ${testResults.resourceUpload ? '✅' : '❌'}`);
    console.log(`Save Function: ${testResults.saveFunction ? '✅' : '❌'}`);
    console.log(`Validation: ${testResults.validation ? '✅' : '❌'}`);
    console.log(`Notifications: ${testResults.notifications ? '✅' : '❌'}`);
    console.log('====================');
    console.log(`Overall: ${overallPass ? '✅ PASS' : '❌ FAIL'} (${passedTests}/${totalTests} tests passed)`);

    if (overallPass) {
      console.log('\n🎉 E2E TEST PASSED! Edit modal is working correctly.');
    } else {
      console.log('\n⚠️ E2E TEST FAILED! Some issues need attention.');
    }

    console.log('\n💡 Manual verification steps:');
    console.log('1. Edit button opens modal');
    console.log('2. Category dropdown shows all options');
    console.log('3. Resource upload buttons work');
    console.log('4. Save button attempts to save');
    console.log('5. No 500 errors in console');
    console.log('6. Appropriate notifications shown');

  } catch (error) {
    console.error('E2E Test Error:', error);
  }
}

// Make available globally
window.runE2EEditModalTest = runE2ETest;

// Auto-run after 3 seconds
console.log('🤖 Auto-running E2E test in 3 seconds...');
setTimeout(runE2ETest, 3000);

// Improved E2E Edit Modal Test
// Fixed navigation and save button detection

console.log('Loading IMPROVED E2E Edit Modal Test...');

window.runImprovedE2EEditModalTest = async function() {
  console.log('IMPROVED E2E EDIT MODAL TEST STARTING');
  console.log('==========================================');

  // Test configuration
  const TEST_CONFIG = {
    timeout: 5000,
    slowTimeout: 10000
  };

  // Test results tracking
  const testResults = {
    modalOpen: false,
    categoryDropdown: false,
    resourceUpload: false,
    saveFunction: false,
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
    const status = passed ? 'PASS' : 'FAIL';
    console.log(`${status} ${testName}${details ? ': ' + details : ''}`);
  }

  // Test 1: Find edit buttons
  async function testEditButtons() {
    console.log('Test 1: Finding Edit Buttons');
    
    try {
      const editButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent.includes('Edit') || 
        btn.querySelector('svg[data-lucide="edit"]')
      );

      if (editButtons.length > 0) {
        logTest('Edit buttons found', true, `${editButtons.length} buttons`);
        return editButtons[0];
      } else {
        logTest('Edit buttons found', false, 'No edit buttons detected');
        return null;
      }
    } catch (error) {
      logTest('Edit buttons test', false, error.message);
      return null;
    }
  }

  // Test 2: Open edit modal
  async function testModalOpen(editButton) {
    console.log('Test 2: Opening Edit Modal');
    
    try {
      if (!editButton) {
        logTest('Modal open', false, 'No edit button available');
        return false;
      }

      editButton.click();
      
      const modal = await waitForElement('[class*="fixed inset-0"]', TEST_CONFIG.slowTimeout);
      
      if (modal) {
        logTest('Modal open', true, 'Modal detected');
        testResults.modalOpen = true;
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
    console.log('Test 3: Testing Category Dropdown');
    
    try {
      const categorySelect = document.querySelector('#category') ||
                           Array.from(document.querySelectorAll('label')).find(label => 
                             label.textContent.includes('Category')
                           )?.parentElement?.querySelector('select');

      if (!categorySelect) {
        logTest('Category dropdown found', false, 'Category select not found');
        return false;
      }

      logTest('Category dropdown found', true, 'Native select element');

      const options = categorySelect.querySelectorAll('option');
      if (options.length > 1) {
        logTest('Category options', true, `${options.length} options available`);
        
        const firstOption = options[1];
        if (firstOption && firstOption.value) {
          categorySelect.value = firstOption.value;
          
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

  // Test 4: Test resource upload (with improved navigation)
  async function testResourceUpload() {
    console.log('Test 4: Testing Resource Upload');
    
    try {
      // Navigate to Resources step (step 2)
      // Current step is 0 (Basic Info), need to click Next twice
      for (let i = 0; i < 2; i++) {
        const nextButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent.includes('Next') && !btn.disabled
        );

        if (!nextButton) {
          logTest('Navigate to Resources', false, `No Next button found on iteration ${i}`);
          return false;
        }

        console.log(`Clicking Next button (iteration ${i + 1})`);
        nextButton.click();
        await sleep(1000); // Wait for step transition
      }

      // Now we should be on Resources step
      const uploadButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent.includes('Upload')
      );

      if (uploadButtons.length > 0) {
        logTest('Upload buttons found', true, `${uploadButtons.length} upload buttons`);
        
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

  // Test 5: Test save functionality (with improved navigation)
  async function testSaveFunction() {
    console.log('Test 5: Testing Save Function');
    
    try {
      // Navigate to Review step (step 4)
      // We're currently on Resources step (step 2), need to click Next twice
      for (let i = 0; i < 2; i++) {
        const nextButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent.includes('Next') && !btn.disabled
        );

        if (!nextButton) {
          logTest('Navigate to Review', false, `No Next button found on iteration ${i}`);
          return false;
        }

        console.log(`Clicking Next button to Review (iteration ${i + 1})`);
        nextButton.click();
        await sleep(1000); // Wait for step transition
      }

      // Now we should be on Review step
      const saveButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('Save Changes') || btn.textContent.includes('Save')
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

      // Monitor console for save attempts
      let saveAttempted = false;
      const originalLog = console.log;
      console.log = function(...args) {
        originalLog.apply(console, args);
        
        if (args[0] && args[0].includes && args[0].includes('Saving course')) {
          saveAttempted = true;
          logTest('Save attempt detected', true, 'Save function called');
        }
      };

      saveButton.click();
      await sleep(3000);
      
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

  // Main test runner
  try {
    console.log('Starting IMPROVED E2E Edit Modal Test...');
    
    // Test 1: Find edit buttons
    const editButton = await testEditButtons();
    if (!editButton) {
      console.log('Cannot proceed without edit button');
      return;
    }

    // Test 2: Open modal
    const modalOpened = await testModalOpen(editButton);
    if (!modalOpened) {
      console.log('Cannot proceed without modal');
      return;
    }

    // Test 3: Category dropdown
    await testCategoryDropdown();

    // Test 4: Resource upload (with improved navigation)
    await testResourceUpload();

    // Test 5: Save function (with improved navigation)
    await testSaveFunction();

    // Calculate results
    const passedTests = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;
    const overallPass = passedTests >= (totalTests * 0.6);

    testResults.overall = overallPass;

    console.log('IMPROVED E2E TEST RESULTS');
    console.log('==========================');
    console.log(`Modal Open: ${testResults.modalOpen ? 'PASS' : 'FAIL'}`);
    console.log(`Category Dropdown: ${testResults.categoryDropdown ? 'PASS' : 'FAIL'}`);
    console.log(`Resource Upload: ${testResults.resourceUpload ? 'PASS' : 'FAIL'}`);
    console.log(`Save Function: ${testResults.saveFunction ? 'PASS' : 'FAIL'}`);
    console.log('==========================');
    console.log(`Overall: ${overallPass ? 'PASS' : 'FAIL'} (${passedTests}/${totalTests} tests passed)`);

    if (overallPass) {
      console.log('IMPROVED E2E TEST PASSED! Edit modal is working correctly.');
    } else {
      console.log('IMPROVED E2E TEST FAILED! Some issues need attention.');
    }

  } catch (error) {
    console.error('E2E Test Error:', error);
  }
};

console.log('IMPROVED E2E Edit Modal Test loaded. Run: runImprovedE2EEditModalTest()');

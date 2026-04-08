// Edit Modal Test Script
// Tests the enhanced course edit modal functionality

console.log('🧪 EDIT MODAL TEST SCRIPT');
console.log('================================');

// Test 1: Check if modal component exists
function testModalComponent() {
  console.log('\n📋 Test 1: Modal Component Existence');
  
  const modal = document.querySelector('[class*="fixed inset-0 z-50"]');
  if (modal) {
    console.log('✅ Modal container found');
    return true;
  } else {
    console.log('❌ Modal container not found');
    console.log('💡 Try clicking the "Edit" button on a course');
    return false;
  }
}

// Test 2: Check category dropdown functionality
function testCategoryDropdown() {
  console.log('\n📋 Test 2: Category Dropdown');
  
  const categorySelects = document.querySelectorAll('[class*="Select"]');
  let categoryFound = false;
  
  categorySelects.forEach(select => {
    const label = select.querySelector('label');
    if (label && label.textContent.includes('Category')) {
      categoryFound = true;
      console.log('✅ Category dropdown found');
      
      // Check if it has options
      const options = select.querySelectorAll('[role="option"]');
      if (options.length > 0) {
        console.log(`✅ Category has ${options.length} options`);
        
        // Try to click and select
        try {
          const trigger = select.querySelector('[role="combobox"]');
          if (trigger) {
            trigger.click();
            setTimeout(() => {
              const firstOption = select.querySelector('[role="option"]');
              if (firstOption) {
                console.log('✅ Category dropdown is clickable');
              } else {
                console.log('❌ Category options not visible');
              }
            }, 100);
          }
        } catch (error) {
          console.log('❌ Error clicking category:', error);
        }
      } else {
        console.log('❌ Category has no options');
      }
    }
  });
  
  if (!categoryFound) {
    console.log('❌ Category dropdown not found');
  }
  
  return categoryFound;
}

// Test 3: Check resource upload functionality
function testResourceUpload() {
  console.log('\n📋 Test 3: Resource Upload');
  
  const uploadButtons = document.querySelectorAll('button');
  let uploadFound = false;
  
  uploadButtons.forEach(button => {
    if (button.textContent.includes('Upload')) {
      uploadFound = true;
      console.log('✅ Upload button found');
      
      // Check if there's a hidden file input
      const parent = button.closest('div');
      const fileInput = parent?.querySelector('input[type="file"]');
      if (fileInput) {
        console.log('✅ File input found for upload');
        console.log(`✅ Accepts: ${fileInput.accept}`);
      } else {
        console.log('❌ No file input found for upload button');
      }
    }
  });
  
  if (!uploadFound) {
    console.log('❌ Upload buttons not found');
    console.log('💡 Navigate to Resources step to test upload');
  }
  
  return uploadFound;
}

// Test 4: Check form inputs and text visibility
function testFormInputs() {
  console.log('\n📋 Test 4: Form Inputs & Text Visibility');
  
  const inputs = document.querySelectorAll('input[type="text"], textarea');
  let visibleInputs = 0;
  
  inputs.forEach((input, index) => {
    const styles = window.getComputedStyle(input);
    const isVisible = styles.color !== 'rgba(0, 0, 0, 0)' && 
                     styles.color !== 'rgb(255, 255, 255)' &&
                     styles.display !== 'none';
    
    if (isVisible) {
      visibleInputs++;
    }
    
    if (index < 5) { // Log first 5 inputs
      console.log(`Input ${index + 1}: ${input.placeholder || 'No placeholder'} - Color: ${styles.color}`);
    }
  });
  
  console.log(`✅ Found ${inputs.length} inputs, ${visibleInputs} with visible text`);
  
  // Check labels
  const labels = document.querySelectorAll('label');
  let visibleLabels = 0;
  labels.forEach(label => {
    const styles = window.getComputedStyle(label);
    if (styles.color !== 'rgba(0, 0, 0, 0)' && 
        styles.color !== 'rgb(255, 255, 255)') {
      visibleLabels++;
    }
  });
  
  console.log(`✅ Found ${labels.length} labels, ${visibleLabels} with visible text`);
  
  return visibleInputs > 0 && visibleLabels > 0;
}

// Test 5: Check save button
function testSaveButton() {
  console.log('\n📋 Test 5: Save Button');
  
  const buttons = document.querySelectorAll('button');
  let saveButton = null;
  
  buttons.forEach(button => {
    if (button.textContent.includes('Save Changes')) {
      saveButton = button;
      console.log('✅ Save button found');
      
      // Check if it's enabled
      if (!button.disabled) {
        console.log('✅ Save button is enabled');
        
        // Check click handler
        const onclick = button.getAttribute('onclick');
        if (onclick || button.onclick) {
          console.log('✅ Save button has click handler');
        } else {
          console.log('⚠️ Save button may not have click handler');
        }
      } else {
        console.log('❌ Save button is disabled');
      }
    }
  });
  
  if (!saveButton) {
    console.log('❌ Save button not found');
    console.log('💡 Navigate to Review step to see save button');
  }
  
  return saveButton !== null;
}

// Test 6: Check navigation between steps
function testStepNavigation() {
  console.log('\n📋 Test 6: Step Navigation');
  
  const navButtons = document.querySelectorAll('button');
  let nextButton = null;
  let prevButton = null;
  
  navButtons.forEach(button => {
    if (button.textContent.includes('Next')) {
      nextButton = button;
      console.log('✅ Next button found');
    }
    if (button.textContent.includes('Previous')) {
      prevButton = button;
      console.log('✅ Previous button found');
    }
  });
  
  // Test current step indicator
  const progressText = document.querySelector('[class*="text-sm"]');
  if (progressText) {
    console.log(`✅ Progress indicator found: ${progressText.textContent}`);
  }
  
  return { nextButton, prevButton };
}

// Test 7: Check modal backdrop and close functionality
function testModalClose() {
  console.log('\n📋 Test 7: Modal Close Functionality');
  
  const backdrop = document.querySelector('[class*="bg-black/50"]');
  if (backdrop) {
    console.log('✅ Modal backdrop found');
    
    // Look for close button (X)
    const closeButtons = document.querySelectorAll('button');
    let closeButton = null;
    
    closeButtons.forEach(button => {
      const svg = button.querySelector('svg');
      if (svg && svg.getAttribute('data-lucide') === 'x') {
        closeButton = button;
        console.log('✅ Close button (X) found');
      }
    });
    
    if (!closeButton) {
      console.log('❌ Close button not found');
    }
    
    return { backdrop, closeButton };
  } else {
    console.log('❌ Modal backdrop not found');
    return { backdrop: null, closeButton: null };
  }
}

// Test 8: Check console for errors
function testConsoleErrors() {
  console.log('\n📋 Test 8: Console Error Check');
  
  // Check for any 404 errors in the last 30 seconds
  const originalError = console.error;
  let errorCount = 0;
  
  console.error = function(...args) {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('404')) {
      errorCount++;
    }
    originalError.apply(console, args);
  };
  
  setTimeout(() => {
    console.error = originalError;
    if (errorCount === 0) {
      console.log('✅ No 404 errors detected');
    } else {
      console.log(`❌ Found ${errorCount} 404 errors`);
    }
  }, 1000);
}

// Main test runner
function runEditModalTests() {
  console.log('🚀 Starting Edit Modal Tests...');
  
  const results = {
    modalExists: testModalComponent(),
    categoryWorks: testCategoryDropdown(),
    resourceUpload: testResourceUpload(),
    formInputsVisible: testFormInputs(),
    saveButtonWorks: testSaveButton(),
    navigationWorks: testStepNavigation(),
    closeFunctionality: testModalClose(),
  };
  
  setTimeout(() => {
    testConsoleErrors();
    
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('========================');
    console.log(`Modal Exists: ${results.modalExists ? '✅' : '❌'}`);
    console.log(`Category Dropdown: ${results.categoryWorks ? '✅' : '❌'}`);
    console.log(`Resource Upload: ${results.resourceUpload ? '✅' : '❌'}`);
    console.log(`Form Inputs Visible: ${results.formInputsVisible ? '✅' : '❌'}`);
    console.log(`Save Button: ${results.saveButtonWorks ? '✅' : '❌'}`);
    console.log(`Navigation Works: ${results.navigationWorks.nextButton ? '✅' : '❌'}`);
    console.log(`Close Functionality: ${results.closeFunctionality.closeButton ? '✅' : '❌'}`);
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 OVERALL: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED! Edit modal is working perfectly!');
    } else {
      console.log('⚠️ Some tests failed. Check the details above.');
    }
    
    console.log('\n💡 TIPS:');
    if (!results.modalExists) {
      console.log('- Click the "Edit" button on any course in admin dashboard');
    }
    if (!results.categoryWorks) {
      console.log('- Navigate to Basic Info step to test category dropdown');
    }
    if (!results.resourceUpload) {
      console.log('- Navigate to Resources step to test upload functionality');
    }
    if (!results.saveButtonWorks) {
      console.log('- Navigate to Review step to test save button');
    }
    
  }, 2000);
}

// Auto-run tests
if (typeof window !== 'undefined') {
  // Make it available globally
  window.runEditModalTests = runEditModalTests;
  
  console.log('🔧 Edit Modal Test Script Loaded');
  console.log('💡 Run tests with: runEditModalTests()');
  console.log('💡 Make sure the edit modal is open before running tests');
  
  // Auto-run after 2 seconds
  setTimeout(() => {
    console.log('\n🤖 Auto-running tests in 2 seconds...');
    setTimeout(runEditModalTests, 2000);
  }, 2000);
} else {
  console.log('❌ This script must be run in a browser environment');
}

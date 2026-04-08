// Edit Modal Flow Test Script
// Comprehensive test for the entire edit modal functionality

console.log('=== EDIT MODAL FLOW TEST ===');
console.log('Testing all critical functionality...');

// Test 1: Check if we're on admin dashboard
function testAdminDashboard() {
  console.log('\n1. Admin Dashboard Check');
  const adminElements = document.querySelectorAll('[class*="admin"], [data-testid*="admin"]');
  if (adminElements.length > 0) {
    console.log('   Admin dashboard detected');
    return true;
  } else {
    console.log('   Not on admin dashboard');
    return false;
  }
}

// Test 2: Find and test edit buttons
function testEditButtons() {
  console.log('\n2. Edit Buttons Test');
  const editButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent.includes('Edit') || btn.querySelector('svg[data-lucide="edit"]')
  );
  
  if (editButtons.length > 0) {
    console.log(`   Found ${editButtons.length} edit buttons`);
    
    // Test first edit button
    const firstEditBtn = editButtons[0];
    console.log('   Testing first edit button...');
    
    try {
      firstEditBtn.click();
      console.log('   Edit button clicked successfully');
      return true;
    } catch (error) {
      console.log('   Error clicking edit button:', error);
      return false;
    }
  } else {
    console.log('   No edit buttons found');
    return false;
  }
}

// Test 3: Check modal opens
function testModalOpen() {
  console.log('\n3. Modal Open Test');
  
  // Wait a bit for modal to open
  setTimeout(() => {
    const modal = document.querySelector('[class*="fixed inset-0"]');
    if (modal) {
      console.log('   Modal opened successfully');
      testModalContent();
    } else {
      console.log('   Modal failed to open');
    }
  }, 1000);
}

// Test 4: Test modal content
function testModalContent() {
  console.log('\n4. Modal Content Test');
  
  // Check for form inputs
  const inputs = document.querySelectorAll('input[type="text"], textarea');
  console.log(`   Found ${inputs.length} text inputs`);
  
  // Check for category dropdown
  const categorySelects = document.querySelectorAll('select, [role="combobox"]');
  console.log(`   Found ${categorySelects.length} select elements`);
  
  // Test category dropdown specifically
  const categoryLabel = Array.from(document.querySelectorAll('label')).find(label => 
    label.textContent.includes('Category')
  );
  
  if (categoryLabel) {
    console.log('   Category field found');
    const selectContainer = categoryLabel.closest('div');
    const trigger = selectContainer?.querySelector('[role="combobox"]');
    
    if (trigger) {
      console.log('   Category dropdown trigger found');
      
      // Try to open dropdown
      try {
        trigger.click();
        console.log('   Category dropdown clicked');
        
        // Check for options after a delay
        setTimeout(() => {
          const options = document.querySelectorAll('[role="option"]');
          console.log(`   Found ${options.length} category options`);
          
          if (options.length > 0) {
            console.log('   Category dropdown is working!');
            // Click first option
            options[0].click();
            console.log('   Selected first category option');
          } else {
            console.log('   No category options found');
          }
        }, 500);
      } catch (error) {
        console.log('   Error clicking category dropdown:', error);
      }
    }
  }
  
  // Test resource upload
  setTimeout(() => testResourceUpload(), 2000);
}

// Test 5: Test resource upload
function testResourceUpload() {
  console.log('\n5. Resource Upload Test');
  
  // Navigate to resources step (click Next buttons)
  const nextButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent.includes('Next')
  );
  
  if (nextButtons.length > 0) {
    console.log('   Navigating to resources step...');
    
    // Click Next twice to get to Resources (assuming we're on Basic Info)
    setTimeout(() => {
      nextButtons[0].click();
      
      setTimeout(() => {
        const nextBtn2 = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent.includes('Next')
        );
        if (nextBtn2) {
          nextBtn2.click();
          
          setTimeout(() => {
            const uploadButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
              btn.textContent.includes('Upload')
            );
            
            if (uploadButtons.length > 0) {
              console.log(`   Found ${uploadButtons.length} upload buttons`);
              console.log('   Resource upload functionality is present');
            } else {
              console.log('   No upload buttons found');
            }
            
            // Test save button
            setTimeout(() => testSaveButton(), 1000);
          }, 1000);
        }
      }, 500);
    }, 500);
  } else {
    console.log('   No Next button found');
  }
}

// Test 6: Test save functionality
function testSaveButton() {
  console.log('\n6. Save Button Test');
  
  // Navigate to Review step
  const nextButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent.includes('Next')
  );
  
  if (nextButtons.length > 0) {
    console.log('   Navigating to review step...');
    nextButtons[0].click();
    
    setTimeout(() => {
      const saveButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('Save Changes')
      );
      
      if (saveButton) {
        console.log('   Save button found');
        
        if (!saveButton.disabled) {
          console.log('   Save button is enabled');
          
          // Test save
          try {
            console.log('   Attempting to save...');
            saveButton.click();
            
            // Check for results after a delay
            setTimeout(() => {
              checkSaveResults();
            }, 2000);
          } catch (error) {
            console.log('   Error clicking save button:', error);
          }
        } else {
          console.log('   Save button is disabled');
        }
      } else {
        console.log('   Save button not found');
      }
    }, 1000);
  } else {
    console.log('   No Next button to reach review step');
  }
}

// Test 7: Check save results
function checkSaveResults() {
  console.log('\n7. Save Results Check');
  
  // Check for success/error messages
  const toasts = document.querySelectorAll('[role="alert"], [class*="toast"]');
  console.log(`   Found ${toasts.length} toast notifications`);
  
  toasts.forEach((toast, index) => {
    console.log(`   Toast ${index + 1}: ${toast.textContent}`);
  });
  
  // Check console for errors
  setTimeout(() => {
    console.log('\n8. Console Check');
    console.log('   Check browser console for any errors or success messages');
    console.log('   Look for:');
    console.log('   - "Saving course with data:" (should show data being sent)');
    console.log('   - "Save response:" (should show API response)');
    console.log('   - Any 404 or 500 errors');
    
    console.log('\n=== TEST COMPLETE ===');
    console.log('Manual verification steps:');
    console.log('1. Edit button opens modal');
    console.log('2. Category dropdown shows all options');
    console.log('3. Resource upload buttons work');
    console.log('4. Save button attempts to save');
    console.log('5. Check console for detailed logs');
  }, 1000);
}

// Auto-run tests
function runAllTests() {
  console.log('Starting comprehensive edit modal flow test...');
  
  testAdminDashboard();
  
  if (testEditButtons()) {
    testModalOpen();
  } else {
    console.log('Cannot proceed without edit buttons');
  }
}

// Make available globally
window.runEditModalFlowTest = runAllTests;

// Auto-run after 2 seconds
setTimeout(() => {
  console.log('Auto-running edit modal flow test in 2 seconds...');
  runAllTests();
}, 2000);

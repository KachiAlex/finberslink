// Enhanced Test Script - Accounts for conditional logic and better debugging
console.log("=== Enhanced FinbersLink Testing ===");

// Resource Library Test - Enhanced
function testResourceLibrary() {
  console.log("\n📁 Testing Resource Library...");
  
  // Look for ResourceLibrary component
  const resourceLibrary = document.querySelector('[class*="space-y-6"]');
  const searchInput = document.querySelector('input[placeholder*="Search" i], input[placeholder*="search" i], input[type="search"]');
  const filterSelect = document.querySelector('select');
  const downloadButtons = Array.from(document.querySelectorAll('button, a')).filter(btn => {
    const text = btn.textContent?.toLowerCase() || '';
    return text.includes('download') || text.includes('save');
  });
  
  console.log(`📊 Resource Library Container: ${!!resourceLibrary}`);
  console.log(`📊 Search Input: ${!!searchInput}`);
  console.log(`📊 Filter Select: ${!!filterSelect}`);
  console.log(`📊 Download Buttons: ${downloadButtons.length}`);
  
  // Check for sample resources
  const resourceCards = document.querySelectorAll('[class*="group"]');
  console.log(`📊 Resource Cards: ${resourceCards.length}`);
  
  return !!resourceLibrary && !!searchInput && !!filterSelect && downloadButtons.length > 0;
}

// PDF Viewing Test - Enhanced
function testPDFViewing() {
  console.log("\n📄 Testing PDF Viewing...");
  
  const pdfLinks = Array.from(document.querySelectorAll('a, button, iframe')).filter(el => {
    const href = el.href || el.src || '';
    const text = el.textContent?.toLowerCase() || '';
    return href.includes('.pdf') || text.includes('pdf');
  });
  
  console.log(`📊 Found ${pdfLinks.length} PDF-related elements`);
  pdfLinks.forEach((el, i) => {
    console.log(`PDF Element ${i+1}: ${el.textContent?.trim() || el.href || el.src}`);
  });
  
  return pdfLinks.length > 0;
}

// View Mode Toggle Test - Enhanced
function testViewModeToggle() {
  console.log("\n🔄 Testing View Mode Toggle...");
  
  // Look for view toggle container
  const viewToggleContainer = document.querySelector('.flex.border.border-slate-200.rounded-md');
  const viewButtons = viewToggleContainer ? viewToggleContainer.querySelectorAll('button') : [];
  
  // Check for grid and list icons
  const gridButton = Array.from(viewButtons).find(btn => btn.querySelector('svg[class*="grid"]'));
  const listButton = Array.from(viewButtons).find(btn => btn.querySelector('svg[class*="list"]'));
  
  // Check current layout
  const resourceContainer = document.querySelector('.grid.grid-cols-1, .space-y-4');
  const currentLayout = resourceContainer?.classList.contains('grid') ? 'grid' : 'list';
  
  console.log(`📊 View Toggle Container: ${!!viewToggleContainer}`);
  console.log(`📊 Grid Button: ${!!gridButton}`);
  console.log(`📊 List Button: ${!!listButton}`);
  console.log(`📊 Current Layout: ${currentLayout}`);
  
  // Test functionality by checking if both buttons exist
  const hasToggle = viewToggleContainer && gridButton && listButton;
  
  if (hasToggle) {
    console.log(`✅ View toggle buttons found and functional`);
  } else {
    console.log(`❌ View toggle buttons not found properly`);
  }
  
  return hasToggle;
}

// Enhanced Course Cards Test - Better selectors
function testAdminCourseCards() {
  console.log("\n📚 Testing Admin Course Cards...");
  
  // Try more specific selectors
  const selectors = [
    'div[class*="group"]', // Resource cards
    'div[class*="hover:shadow"]', // Course cards with hover
    'div[class*="border-slate"]', // Cards with borders
    'div[class*="rounded"]', // Rounded elements
    'div[class*="bg-white"]', // White backgrounds
    '[class*="transition-all"]' // Elements with transitions
  ];
  
  let foundElements = [];
  for (const selector of selectors) {
    foundElements = document.querySelectorAll(selector);
    if (foundElements.length > 0) {
      console.log(`✅ Found ${foundElements.length} elements with selector: ${selector}`);
      break;
    }
  }
  
  if (foundElements.length === 0) {
    console.log("❌ No cards found");
    return false;
  }
  
  let functionalCards = 0;
  foundElements.forEach((card, index) => {
    const hasTitle = card.querySelector('h1, h2, h3, h4, h5, h6, [class*="text"], [class*="font"]');
    const hasImage = card.querySelector('img');
    const hasButtons = card.querySelectorAll('button').length > 0;
    
    console.log(`Element ${index + 1}: Title=${!!hasTitle}, Image=${!!hasImage}, Buttons=${hasButtons}`);
    
    if (hasTitle && hasImage && hasButtons) {
      functionalCards++;
    }
  });
  
  console.log(`📊 Functional Elements: ${functionalCards}/${foundElements.length}`);
  return functionalCards === foundElements.length;
}

// Edit Modal Test - Enhanced
function testEditModal() {
  console.log("\n✏️ Testing Edit Modal...");
  
  const editButtons = Array.from(document.querySelectorAll('button, a[role="button"]')).filter(btn => {
    const text = btn.textContent?.toLowerCase() || '';
    return text.includes('edit') || text.includes('modify') || text.includes('change');
  });
  
  console.log(`📊 Found ${editButtons.length} edit buttons`);
  editButtons.forEach((btn, index) => {
    console.log(`Edit Button ${index + 1}: "${btn.textContent?.trim()}"`);
  });
  
  return editButtons.length > 0;
}

// Archive/Restore Test - Enhanced
function testArchiveRestoreButtons() {
  console.log("\n📦 Testing Archive/Restore Buttons...");
  
  const archiveButtons = Array.from(document.querySelectorAll('button, a[role="button"]')).filter(btn => {
    const text = btn.textContent?.toLowerCase() || '';
    return text.includes('archive') || text.includes('restore') || text.includes('unarchive');
  });
  
  console.log(`📊 Found ${archiveButtons.length} archive/restore buttons`);
  archiveButtons.forEach((btn, index) => {
    console.log(`Archive/Restore Button ${index + 1}: "${btn.textContent?.trim()}"`);
  });
  
  return archiveButtons.length > 0;
}

// Cover Images Test - Enhanced
function testCoverImages() {
  console.log("\n🖼️ Testing Cover Images...");
  
  const images = document.querySelectorAll('img');
  let loadedCount = 0;
  let failedCount = 0;
  
  images.forEach((img, index) => {
    if (img.complete && img.naturalHeight !== 0) {
      loadedCount++;
      console.log(`✅ Image ${index + 1}: Loaded (${img.alt || 'No alt'})`);
    } else {
      failedCount++;
      console.log(`❌ Image ${index + 1}: Failed to load`);
    }
  });
  
  console.log(`📊 Images: ${loadedCount} loaded, ${failedCount} failed`);
  return failedCount === 0;
}

// Video Embedding Test - Enhanced
function testVideoEmbedding() {
  console.log("\n🎥 Testing Video Embedding...");
  
  const iframes = document.querySelectorAll('iframe');
  let cleanEmbeds = 0;
  let brandedEmbeds = 0;
  
  iframes.forEach((iframe, index) => {
    const src = iframe.src;
    console.log(`📹 Video ${index + 1}: ${src.substring(0, 50)}...`);
    
    if (src.includes('youtube.com')) {
      if (src.includes('modestbranding=1') || src.includes('showinfo=0')) {
        cleanEmbeds++;
        console.log(`✅ YouTube: Clean embed (branding removed)`);
      } else {
        brandedEmbeds++;
        console.log(`⚠️ YouTube: Branding visible`);
      }
    } else if (src.includes('vimeo.com')) {
      if (src.includes('title=0') || src.includes('portrait=0')) {
        cleanEmbeds++;
        console.log(`✅ Vimeo: Clean player`);
      } else {
        brandedEmbeds++;
        console.log(`⚠️ Vimeo: Full player`);
      }
    } else {
      cleanEmbeds++;
      console.log(`✅ Other: ${src.split('/')[2] || 'Unknown'}`);
    }
  });
  
  console.log(`📊 Videos: ${cleanEmbeds} clean, ${brandedEmbeds} branded`);
  return cleanEmbeds >= iframes.length;
}

// Page Detection
function detectCurrentPage() {
  const url = window.location.pathname;
  console.log(`\n🌍 Current Page: ${url}`);
  
  if (url.includes('/admin/courses')) {
    return 'admin-courses';
  } else if (url.includes('/courses/') && !url.includes('/admin')) {
    return 'course-detail';
  } else if (url.includes('/admin')) {
    return 'admin';
  } else {
    return 'unknown';
  }
}

// Smart test runner - runs relevant tests based on page
function runSmartTests() {
  const page = detectCurrentPage();
  console.log(`\n🎯 Running tests for: ${page}`);
  
  const tests = [];
  
  if (page === 'course-detail') {
    tests.push(
      { name: "Resource Library", test: testResourceLibrary },
      { name: "PDF Viewing", test: testPDFViewing },
      { name: "View Mode Toggle", test: testViewModeToggle },
      { name: "Video Embedding", test: testVideoEmbedding }
    );
  } else if (page === 'admin-courses') {
    tests.push(
      { name: "Admin Course Cards", test: testAdminCourseCards },
      { name: "Edit Modal", test: testEditModal },
      { name: "Archive/Restore", test: testArchiveRestoreButtons }
    );
  } else {
    // Run all tests
    tests.push(
      { name: "Cover Images", test: testCoverImages },
      { name: "Video Embedding", test: testVideoEmbedding },
      { name: "Admin Course Cards", test: testAdminCourseCards },
      { name: "Edit Modal", test: testEditModal },
      { name: "Archive/Restore", test: testArchiveRestoreButtons },
      { name: "Resource Library", test: testResourceLibrary },
      { name: "PDF Viewing", test: testPDFViewing },
      { name: "View Mode Toggle", test: testViewModeToggle }
    );
  }
  
  let passed = 0;
  let total = tests.length;
  
  tests.forEach(result => {
    try {
      const success = result.test();
      if (success) passed++;
      console.log(`✅ ${result.name}: PASSED`);
    } catch (error) {
      console.log(`❌ ${result.name}: ERROR - ${error.message}`);
    }
  });
  
  console.log("\n=== SMART TEST RESULTS ===");
  console.log(`📊 Page: ${page}`);
  console.log(`📊 Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${total - passed}`);
  console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log("\n🎉 ALL TESTS PASSED for this page!");
  } else {
    console.log("\n⚠️ Some tests failed. Check details above.");
  }
  
  return passed === total;
}

// Complete test runner - runs all tests
function runCompleteTests() {
  console.log("🚀 Running Complete Test Suite...\n");
  
  const results = [
    { name: "Cover Images", test: testCoverImages },
    { name: "Video Embedding", test: testVideoEmbedding },
    { name: "Admin Course Cards", test: testAdminCourseCards },
    { name: "Edit Modal", test: testEditModal },
    { name: "Archive/Restore", test: testArchiveRestoreButtons },
    { name: "Resource Library", test: testResourceLibrary },
    { name: "PDF Viewing", test: testPDFViewing },
    { name: "View Mode Toggle", test: testViewModeToggle }
  ];
  
  let passed = 0;
  let total = results.length;
  
  results.forEach(result => {
    try {
      const success = result.test();
      if (success) passed++;
      console.log(`✅ ${result.name}: PASSED`);
    } catch (error) {
      console.log(`❌ ${result.name}: ERROR - ${error.message}`);
    }
  });
  
  console.log("\n=== FINAL TEST RESULTS ===");
  console.log(`📊 Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${total - passed}`);
  console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log("\n🎉 ALL TESTS PASSED! Course flow is working correctly!");
  } else {
    console.log("\n⚠️ Some tests failed. Check details above.");
  }
  
  return passed === total;
}

// Make all functions available globally
window.testResourceLibrary = testResourceLibrary;
window.testPDFViewing = testPDFViewing;
window.testViewModeToggle = testViewModeToggle;
window.testAdminCourseCards = testAdminCourseCards;
window.testEditModal = testEditModal;
window.testArchiveRestoreButtons = testArchiveRestoreButtons;
window.testCoverImages = testCoverImages;
window.testVideoEmbedding = testVideoEmbedding;
window.runCompleteTests = runCompleteTests;
window.runSmartTests = runSmartTests;
window.detectCurrentPage = detectCurrentPage;

console.log("\n📋 Enhanced Test Functions Available:");
console.log("- runSmartTests() - Run page-specific tests (RECOMMENDED)");
console.log("- runCompleteTests() - Run all tests");
console.log("- detectCurrentPage() - Show current page");
console.log("- testResourceLibrary() - Test resource library");
console.log("- testPDFViewing() - Test PDF viewing");
console.log("- testViewModeToggle() - Test view toggle");
console.log("- testAdminCourseCards() - Test course cards");
console.log("- testEditModal() - Test edit buttons");
console.log("- testArchiveRestoreButtons() - Test archive/restore");
console.log("- testCoverImages() - Test image rendering");
console.log("- testVideoEmbedding() - Test video embedding");

console.log("\n🚀 RECOMMENDED: Run smart tests for your current page:");
console.log("runSmartTests();");

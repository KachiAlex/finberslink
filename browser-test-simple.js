// FinbersLink Browser Test Script - Copy and paste this directly into browser console
console.log("=== FinbersLink E2E Browser Testing ===");

// Test 1: Cover Images
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

// Test 2: Video Embedding
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

// Test 3: Admin Course Cards
function testAdminCourseCards() {
  console.log("\n📚 Testing Admin Course Cards...");
  
  const courseCards = document.querySelectorAll('[data-testid="course-card"], .course-card, .bg-white.rounded-lg');
  let functionalCards = 0;
  
  courseCards.forEach((card, index) => {
    const hasTitle = card.querySelector('h3, .text-lg');
    const hasImage = card.querySelector('img');
    const hasButtons = card.querySelectorAll('button').length > 0;
    
    if (hasTitle && hasImage && hasButtons) {
      functionalCards++;
      console.log(`✅ Course Card ${index + 1}: Complete`);
    } else {
      console.log(`❌ Course Card ${index + 1}: Missing elements`);
    }
  });
  
  console.log(`📊 Course Cards: ${functionalCards} functional, ${courseCards.length - functionalCards} incomplete`);
  return functionalCards === courseCards.length;
}

// Test 4: Edit Modal
function testEditModal() {
  console.log("\n✏️ Testing Edit Modal...");
  
  // Look for edit buttons
  const editButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent?.includes('Edit') || btn.textContent?.includes('edit')
  );
  
  console.log(`📊 Found ${editButtons.length} edit buttons`);
  
  if (editButtons.length > 0) {
    console.log("✅ Edit buttons found on page");
    return true;
  } else {
    console.log("❌ No edit buttons found");
    return false;
  }
}

// Test 5: Archive/Restore Buttons
function testArchiveRestoreButtons() {
  console.log("\n📦 Testing Archive/Restore Buttons...");
  
  const archiveButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent?.includes('Archive') || btn.textContent?.includes('Restore')
  );
  
  console.log(`📊 Found ${archiveButtons.length} archive/restore buttons`);
  
  if (archiveButtons.length > 0) {
    console.log("✅ Archive/Restore buttons found");
    return true;
  } else {
    console.log("❌ No archive/restore buttons found");
    return false;
  }
}

// Test 6: Resource Library
function testResourceLibrary() {
  console.log("\n📁 Testing Resource Library...");
  
  const searchInput = document.querySelector('input[placeholder*="Search"], input[placeholder*="search"]');
  const filterSelect = document.querySelector('select');
  const downloadButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent?.includes('Download') || btn.textContent?.includes('download')
  );
  
  const hasSearch = !!searchInput;
  const hasFilter = !!filterSelect;
  const hasDownloads = downloadButtons.length > 0;
  
  console.log(`📊 Search: ${hasSearch ? '✅' : '❌'}`);
  console.log(`📊 Filter: ${hasFilter ? '✅' : '❌'}`);
  console.log(`📊 Downloads: ${hasDownloads ? '✅' : '❌'} (${downloadButtons.length} buttons)`);
  
  return hasSearch && hasFilter && hasDownloads;
}

// Test 7: PDF Viewing
function testPDFViewing() {
  console.log("\n📄 Testing PDF Viewing...");
  
  const pdfLinks = Array.from(document.querySelectorAll('a, button')).filter(el => 
    (el.href && el.href.includes('.pdf')) || 
    (el.textContent && el.textContent.includes('PDF'))
  );
  
  console.log(`📊 Found ${pdfLinks.length} PDF-related elements`);
  
  if (pdfLinks.length > 0) {
    console.log("✅ PDF links/buttons found");
    return true;
  } else {
    console.log("❌ No PDF links/buttons found");
    return false;
  }
}

// Test 8: View Mode Toggle
function testViewModeToggle() {
  console.log("\n🔄 Testing View Mode Toggle...");
  
  const gridButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent?.includes('Grid') || 
    btn.querySelector('svg') && 
    btn.closest('.flex') && 
    btn.closest('.flex').querySelectorAll('button').length >= 2
  );
  
  const hasToggle = gridButtons.length > 0;
  console.log(`📊 View toggle: ${hasToggle ? '✅' : '❌'}`);
  
  return hasToggle;
}

// Main test runner
function runAllBrowserTests() {
  console.log("🚀 Starting Comprehensive Browser Tests...\n");
  
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
    } catch (error) {
      console.log(`❌ ${result.name} failed with error: ${error.message}`);
    }
  });
  
  console.log("\n=== TEST RESULTS SUMMARY ===");
  console.log(`📊 Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${total - passed}`);
  console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log("\n🎉 ALL TESTS PASSED! Course flow is working correctly!");
  } else {
    console.log("\n⚠️ Some tests failed. Check the details above.");
  }
  
  return passed === total;
}

// Individual test functions for targeted testing
window.testCoverImages = testCoverImages;
window.testVideoEmbedding = testVideoEmbedding;
window.testAdminCourseCards = testAdminCourseCards;
window.testEditModal = testEditModal;
window.testArchiveRestoreButtons = testArchiveRestoreButtons;
window.testResourceLibrary = testResourceLibrary;
window.testPDFViewing = testPDFViewing;
window.testViewModeToggle = testViewModeToggle;
window.runAllBrowserTests = runAllBrowserTests;

console.log("\n📋 Available Test Functions:");
console.log("- runAllBrowserTests() - Run all tests");
console.log("- testCoverImages() - Test image rendering");
console.log("- testVideoEmbedding() - Test video embedding");
console.log("- testAdminCourseCards() - Test course cards");
console.log("- testEditModal() - Test edit modal");
console.log("- testArchiveRestoreButtons() - Test archive/restore");
console.log("- testResourceLibrary() - Test resource library");
console.log("- testPDFViewing() - Test PDF viewing");
console.log("- testViewModeToggle() - Test view toggle");

console.log("\n🚀 Ready to test! Run: runAllBrowserTests()");

// Auto-run after 1 second
setTimeout(() => {
  console.log("\n🔄 Auto-running tests in 1 second...");
  setTimeout(runAllBrowserTests, 1000);
}, 1000);

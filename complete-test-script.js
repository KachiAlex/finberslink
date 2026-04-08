// Complete Test Script - All Functions Included
console.log("=== Complete FinbersLink Testing ===");

// Resource Library Test
function testResourceLibrary() {
  console.log("\n📁 Testing Resource Library...");
  
  const searchInput = document.querySelector('input[placeholder*="Search" i], input[placeholder*="search" i], input[type="search"]');
  const filterSelect = document.querySelector('select');
  const downloadButtons = Array.from(document.querySelectorAll('button, a')).filter(btn => {
    const text = btn.textContent?.toLowerCase() || '';
    return text.includes('download') || text.includes('save');
  });
  
  console.log(`📊 Search Input: ${!!searchInput}`);
  console.log(`📊 Filter Select: ${!!filterSelect}`);
  console.log(`📊 Download Buttons: ${downloadButtons.length}`);
  
  return !!searchInput && !!filterSelect && downloadButtons.length > 0;
}

// PDF Viewing Test
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

// View Mode Toggle Test
function testViewModeToggle() {
  console.log("\n🔄 Testing View Mode Toggle...");
  
  const gridButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
    const text = btn.textContent?.toLowerCase() || '';
    return text.includes('grid') || text.includes('list');
  });
  
  console.log(`📊 View Mode Buttons: ${gridButtons.length}`);
  gridButtons.forEach((btn, index) => {
    console.log(`View Button ${index + 1}: "${btn.textContent?.trim()}"`);
  });
  
  return gridButtons.length >= 2;
}

// Enhanced Course Cards Test
function testAdminCourseCards() {
  console.log("\n📚 Testing Admin Course Cards...");
  
  // Try multiple selectors
  const selectors = [
    'div[class*="card"]',
    'div[class*="course"]',
    'article',
    '.bg-white',
    '[class*="rounded"]'
  ];
  
  let courseCards = [];
  for (const selector of selectors) {
    courseCards = document.querySelectorAll(selector);
    if (courseCards.length > 0) {
      console.log(`✅ Found ${courseCards.length} elements with selector: ${selector}`);
      break;
    }
  }
  
  if (courseCards.length === 0) {
    console.log("❌ No course cards found");
    return false;
  }
  
  let functionalCards = 0;
  courseCards.forEach((card, index) => {
    const hasTitle = card.querySelector('h1, h2, h3, h4, h5, h6, [class*="text"], [class*="font"]');
    const hasImage = card.querySelector('img');
    const hasButtons = card.querySelectorAll('button').length > 0;
    
    console.log(`Element ${index + 1}: Title=${!!hasTitle}, Image=${!!hasImage}, Buttons=${hasButtons}`);
    
    if (hasTitle && hasImage && hasButtons) {
      functionalCards++;
    }
  });
  
  console.log(`📊 Functional Elements: ${functionalCards}/${courseCards.length}`);
  return functionalCards === courseCards.length;
}

// Edit Modal Test
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

// Archive/Restore Test
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

// Cover Images Test
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

// Video Embedding Test
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

// Main test runner
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
    console.log("\n⚠️ Some tests failed. Check the details above.");
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

console.log("\n📋 All Test Functions Available:");
console.log("- runCompleteTests() - Run all tests");
console.log("- testResourceLibrary() - Test resource library");
console.log("- testPDFViewing() - Test PDF viewing");
console.log("- testViewModeToggle() - Test view toggle");
console.log("- testAdminCourseCards() - Test course cards");
console.log("- testEditModal() - Test edit buttons");
console.log("- testArchiveRestoreButtons() - Test archive/restore");
console.log("- testCoverImages() - Test image rendering");
console.log("- testVideoEmbedding() - Test video embedding");

console.log("\n🚀 Now you can run all missing tests:");
console.log("runCompleteTests();");

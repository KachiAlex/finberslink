// Quick End-to-End Test Script
// Run this in browser console to test key functionality

console.log("=== FinbersLink E2E Test Script ===");

// Test 1: Cover Image Rendering
function testCoverImages() {
  console.log("Testing cover image rendering...");
  
  // Check if SafeImage components exist
  const safeImages = document.querySelectorAll('img[alt*="Course"]');
  console.log(`Found ${safeImages.length} course images`);
  
  safeImages.forEach((img, index) => {
    if (img.complete && img.naturalHeight !== 0) {
      console.log(`Image ${index + 1}: Loaded successfully`);
    } else {
      console.log(`Image ${index + 1}: Failed to load`);
    }
  });
}

// Test 2: Video Embedding
function testVideoEmbedding() {
  console.log("Testing video embedding...");
  
  const iframes = document.querySelectorAll('iframe');
  console.log(`Found ${iframes.length} embedded videos`);
  
  iframes.forEach((iframe, index) => {
    const src = iframe.src;
    if (src.includes('youtube.com')) {
      console.log(`Video ${index + 1}: YouTube embed - ${src.includes('modestbranding=1') ? 'Branding removed' : 'Branding visible'}`);
    } else if (src.includes('vimeo.com')) {
      console.log(`Video ${index + 1}: Vimeo embed - ${src.includes('title=0') ? 'Clean player' : 'Full player'}`);
    } else {
      console.log(`Video ${index + 1}: Other platform - ${src}`);
    }
  });
}

// Test 3: PDF Resources
function testPDFResources() {
  console.log("Testing PDF resources...");
  
  // Check for PDF viewer components
  const pdfViewers = document.querySelectorAll('[data-testid="pdf-viewer"]');
  console.log(`Found ${pdfViewers.length} PDF viewers`);
  
  // Check for download buttons
  const downloadButtons = document.querySelectorAll('button:contains("Download")');
  console.log(`Found ${downloadButtons.length} download buttons`);
  
  // Test PDF links
  const pdfLinks = Array.from(document.querySelectorAll('a')).filter(link => 
    link.href && link.href.includes('.pdf')
  );
  console.log(`Found ${pdfLinks.length} PDF links`);
}

// Test 4: Course Management
function testCourseManagement() {
  console.log("Testing course management...");
  
  // Check admin course grid
  const courseCards = document.querySelectorAll('[data-testid="course-card"]');
  console.log(`Found ${courseCards.length} course cards`);
  
  // Check edit buttons
  const editButtons = document.querySelectorAll('button:contains("Edit")');
  console.log(`Found ${editButtons.length} edit buttons`);
  
  // Check archive buttons
  const archiveButtons = document.querySelectorAll('button:contains("Archive")');
  console.log(`Found ${archiveButtons.length} archive buttons`);
}

// Test 5: Resource Library
function testResourceLibrary() {
  console.log("Testing resource library...");
  
  // Check search functionality
  const searchInput = document.querySelector('input[placeholder*="Search"]');
  console.log(`Search input found: ${!!searchInput}`);
  
  // Check filter dropdown
  const filterSelect = document.querySelector('select');
  console.log(`Filter dropdown found: ${!!filterSelect}`);
  
  // Check view mode toggle
  const viewToggleButtons = document.querySelectorAll('button:contains("Grid"), button:contains("List")');
  console.log(`Found ${viewToggleButtons.length} view toggle buttons`);
}

// Test 6: Progress Tracking
function testProgressTracking() {
  console.log("Testing progress tracking...");
  
  // Check progress bars
  const progressBars = document.querySelectorAll('[role="progressbar"]');
  console.log(`Found ${progressBars.length} progress bars`);
  
  // Check completion indicators
  const completionCheckboxes = document.querySelectorAll('input[type="checkbox"]');
  console.log(`Found ${completionCheckboxes.length} completion checkboxes`);
}

// Test 7: Certificate System
function testCertificateSystem() {
  console.log("Testing certificate system...");
  
  // Check certificate sections
  const certificateSections = document.querySelectorAll('[data-testid="certificate"]');
  console.log(`Found ${certificateSections.length} certificate sections`);
  
  // Check download certificate buttons
  const certDownloadButtons = document.querySelectorAll('button:contains("Download Certificate")');
  console.log(`Found ${certDownloadButtons.length} certificate download buttons`);
}

// Run all tests
function runAllTests() {
  console.log("Starting comprehensive E2E test...\n");
  
  testCoverImages();
  testVideoEmbedding();
  testPDFResources();
  testCourseManagement();
  testResourceLibrary();
  testProgressTracking();
  testCertificateSystem();
  
  console.log("\n=== Test Complete ===");
  console.log("Review results above for any issues");
}

// Test specific URLs
function testPage(url, testName) {
  console.log(`\n--- Testing ${testName} ---`);
  console.log(`Navigate to: ${url}`);
  console.log("Then call the specific test functions");
}

// Usage examples:
console.log("Available test functions:");
console.log("- runAllTests() - Run all tests");
console.log("- testCoverImages() - Test image rendering");
console.log("- testVideoEmbedding() - Test video embedding");
console.log("- testPDFResources() - Test PDF resources");
console.log("- testCourseManagement() - Test admin course management");
console.log("- testResourceLibrary() - Test resource library");
console.log("- testProgressTracking() - Test progress tracking");
console.log("- testCertificateSystem() - Test certificate system");

console.log("\nTest URLs to visit:");
console.log("- /courses - Course catalog");
console.log("- /admin/courses - Admin course management");
console.log("- /dashboard - Student dashboard");
console.log("- /courses/[id]/resources - Course resources");

// Auto-run tests after 2 seconds
setTimeout(runAllTests, 2000);

// Page Detection and Targeted Testing
console.log("=== FinbersLink Page Detection ===");

function detectCurrentPage() {
  const path = window.location.pathname;
  console.log(`📍 Current page: ${path}`);
  
  if (path.includes('/admin/courses')) {
    console.log("📋 Admin Courses Page Detected");
    return 'admin-courses';
  } else if (path.includes('/courses') && !path.includes('/admin')) {
    if (path.includes('/resources')) {
      console.log("📁 Course Resources Page Detected");
      return 'course-resources';
    } else {
      console.log("📚 Course Catalog Page Detected");
      return 'course-catalog';
    }
  } else if (path.includes('/dashboard')) {
    console.log("🏠 Student Dashboard Detected");
    return 'dashboard';
  } else {
    console.log("❓ Unknown Page");
    return 'unknown';
  }
}

function runPageSpecificTests() {
  const pageType = detectCurrentPage();
  
  switch (pageType) {
    case 'admin-courses':
      console.log("\n🔧 Running Admin Course Tests...");
      testAdminCourseCards();
      testEditModal();
      testArchiveRestoreButtons();
      testViewModeToggle();
      break;
      
    case 'course-resources':
      console.log("\n📁 Running Resource Library Tests...");
      testResourceLibrary();
      testPDFViewing();
      testViewModeToggle();
      break;
      
    case 'course-catalog':
      console.log("\n📚 Running Course Catalog Tests...");
      testCoverImages();
      testVideoEmbedding();
      break;
      
    case 'dashboard':
      console.log("\n🏠 Running Dashboard Tests...");
      testCoverImages();
      break;
      
    default:
      console.log("\n❓ Running General Tests...");
      testCoverImages();
      testVideoEmbedding();
      testAdminCourseCards();
  }
}

// Enhanced test functions with better selectors
function testAdminCourseCards() {
  console.log("\n📚 Testing Admin Course Cards...");
  
  // Try multiple selectors for course cards
  const selectors = [
    '[data-testid="course-card"]',
    '.course-card',
    '.bg-white.rounded-lg.shadow-sm',
    '.bg-white.rounded-lg',
    'article',
    '.card'
  ];
  
  let courseCards = [];
  for (const selector of selectors) {
    courseCards = document.querySelectorAll(selector);
    if (courseCards.length > 0) {
      console.log(`✅ Found ${courseCards.length} course cards with selector: ${selector}`);
      break;
    }
  }
  
  if (courseCards.length === 0) {
    console.log("❌ No course cards found. Trying broader search...");
    courseCards = document.querySelectorAll('div[class*="card"], div[class*="course"]');
  }
  
  let functionalCards = 0;
  courseCards.forEach((card, index) => {
    const hasTitle = card.querySelector('h1, h2, h3, h4, h5, h6, .text-lg, .font-semibold');
    const hasImage = card.querySelector('img');
    const hasButtons = card.querySelectorAll('button').length > 0;
    
    console.log(`Card ${index + 1}: Title=${!!hasTitle}, Image=${!!hasImage}, Buttons=${hasButtons}`);
    
    if (hasTitle && hasImage && hasButtons) {
      functionalCards++;
    }
  });
  
  console.log(`📊 Course Cards: ${functionalCards} functional, ${courseCards.length} total`);
  return functionalCards === courseCards.length && courseCards.length > 0;
}

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
  
  return gridButtons.length >= 2; // Should have at least grid and list
}

// Make functions available globally
window.detectCurrentPage = detectCurrentPage;
window.runPageSpecificTests = runPageSpecificTests;
window.testAdminCourseCards = testAdminCourseCards;
window.testEditModal = testEditModal;
window.testArchiveRestoreButtons = testArchiveRestoreButtons;
window.testResourceLibrary = testResourceLibrary;
window.testViewModeToggle = testViewModeToggle;

console.log("\n📋 Enhanced Test Functions Available:");
console.log("- detectCurrentPage() - Detect current page type");
console.log("- runPageSpecificTests() - Run tests for current page");
console.log("- testAdminCourseCards() - Test admin course cards");
console.log("- testEditModal() - Test edit buttons");
console.log("- testArchiveRestoreButtons() - Test archive/restore");
console.log("- testResourceLibrary() - Test resource library");
console.log("- testViewModeToggle() - Test view toggle");

console.log("\n🚀 Auto-running page-specific tests...");
setTimeout(runPageSpecificTests, 1000);

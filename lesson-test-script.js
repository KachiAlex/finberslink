// Lesson Page Test Script
console.log("=== Lesson Page Testing ===");

// Test lesson content components
function testLessonContent() {
  console.log("\n📚 Testing Lesson Content...");
  
  const lessonTitle = document.querySelector('h1, h2, h3');
  const videoEmbeds = document.querySelectorAll('iframe');
  const pdfViewers = document.querySelectorAll('[class*="pdf"], [data-pdf]');
  const resourceLinks = Array.from(document.querySelectorAll('a, button')).filter(btn => {
    const text = btn.textContent?.toLowerCase() || '';
    return text.includes('download') || text.includes('view') || text.includes('resource');
  });
  
  console.log(`📊 Lesson Title: ${!!lessonTitle}`);
  console.log(`📊 Video Embeds: ${videoEmbeds.length}`);
  console.log(`📊 PDF Viewers: ${pdfViewers.length}`);
  console.log(`📊 Resource Links: ${resourceLinks.length}`);
  
  return !!lessonTitle;
}

// Test video embedding in lesson
function testLessonVideo() {
  console.log("\n🎥 Testing Lesson Video...");
  
  const iframes = document.querySelectorAll('iframe');
  let cleanEmbeds = 0;
  
  iframes.forEach((iframe, index) => {
    const src = iframe.src;
    console.log(`📹 Video ${index + 1}: ${src.substring(0, 50)}...`);
    
    if (src.includes('youtube.com') && src.includes('modestbranding=1')) {
      cleanEmbeds++;
      console.log(`✅ YouTube: Clean embed`);
    } else if (src.includes('vimeo.com') && src.includes('title=0')) {
      cleanEmbeds++;
      console.log(`✅ Vimeo: Clean player`);
    } else if (src) {
      cleanEmbeds++;
      console.log(`✅ Other video platform`);
    }
  });
  
  console.log(`📊 Clean Videos: ${cleanEmbeds}/${iframes.length}`);
  return cleanEmbeds >= iframes.length;
}

// Test lesson resources
function testLessonResources() {
  console.log("\n📄 Testing Lesson Resources...");
  
  const resourceCards = document.querySelectorAll('[class*="resource"], [class*="material"]');
  const downloadButtons = Array.from(document.querySelectorAll('button, a')).filter(btn => {
    const text = btn.textContent?.toLowerCase() || '';
    return text.includes('download') || text.includes('save');
  });
  
  console.log(`📊 Resource Cards: ${resourceCards.length}`);
  console.log(`📊 Download Buttons: ${downloadButtons.length}`);
  
  return resourceCards.length > 0 || downloadButtons.length > 0;
}

// Page detection for lesson
function detectLessonPage() {
  const url = window.location.pathname;
  console.log(`\n🌍 Current Lesson Page: ${url}`);
  
  if (url.includes('/courses/') && url.includes('/lessons/')) {
    return 'lesson-detail';
  } else if (url.includes('/courses/') && !url.includes('/lessons/')) {
    return 'course-detail';
  } else if (url.includes('/admin/courses')) {
    return 'admin-courses';
  } else {
    return 'unknown';
  }
}

// Run lesson-specific tests
function runLessonTests() {
  const page = detectLessonPage();
  console.log(`\n🎯 Running tests for: ${page}`);
  
  const tests = [];
  
  if (page === 'lesson-detail') {
    tests.push(
      { name: "Lesson Content", test: testLessonContent },
      { name: "Lesson Video", test: testLessonVideo },
      { name: "Lesson Resources", test: testLessonResources }
    );
  } else {
    console.log("❌ Not on a lesson page. Navigate to /courses/[courseId]/lessons/[lessonId]");
    return false;
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
  
  console.log("\n=== LESSON TEST RESULTS ===");
  console.log(`📊 Page: ${page}`);
  console.log(`📊 Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${total - passed}`);
  console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log("\n🎉 ALL LESSON TESTS PASSED!");
  } else {
    console.log("\n⚠️ Some lesson tests failed.");
  }
  
  return passed === total;
}

// Make functions available globally
window.testLessonContent = testLessonContent;
window.testLessonVideo = testLessonVideo;
window.testLessonResources = testLessonResources;
window.runLessonTests = runLessonTests;
window.detectLessonPage = detectLessonPage;

console.log("\n📋 Lesson Test Functions Available:");
console.log("- runLessonTests() - Run lesson-specific tests");
console.log("- detectLessonPage() - Show current lesson page");
console.log("- testLessonContent() - Test lesson content");
console.log("- testLessonVideo() - Test lesson video embedding");
console.log("- testLessonResources() - Test lesson resources");

console.log("\n🚀 Run lesson tests:");
console.log("runLessonTests();");

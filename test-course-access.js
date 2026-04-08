// Test script to debug course access issue
const testCourseId = "cmnh9fesf000004icgwzb30fz"; // The course from your screenshot

async function testCourseAccess() {
  console.log("🔍 DEBUGGING COURSE ACCESS ISSUE");
  console.log("===================================");
  console.log(`Testing course: ${testCourseId}`);
  
  try {
    // Test 1: Check if debug API works
    console.log("\n📋 Test 1: Debug API");
    const debugResponse = await fetch(`http://localhost:3000/api/debug/course-access/${testCourseId}`);
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log("✅ Debug API Response:");
      console.log(JSON.stringify(debugData, null, 2));
    } else {
      console.log(`❌ Debug API failed: ${debugResponse.status}`);
      const errorText = await debugResponse.text();
      console.log("Error:", errorText);
    }
    
    // Test 2: Check optimized page
    console.log("\n📋 Test 2: Optimized Page");
    const pageResponse = await fetch(`http://localhost:3000/courses/${testCourseId}/page-optimized`);
    
    if (pageResponse.ok) {
      console.log("✅ Optimized page loads successfully");
    } else {
      console.log(`❌ Optimized page failed: ${pageResponse.status}`);
      const errorText = await pageResponse.text();
      console.log("Error:", errorText.substring(0, 200) + "...");
    }
    
    // Test 3: Check original page
    console.log("\n📋 Test 3: Original Page");
    const originalResponse = await fetch(`http://localhost:3000/courses/${testCourseId}`, {
      redirect: "manual" // Don't follow redirects
    });
    
    if (originalResponse.status === 302) {
      console.log("⚠️ Original page redirects to login (this is the issue)");
      const location = originalResponse.headers.get('location');
      console.log(`Redirects to: ${location}`);
    } else if (originalResponse.ok) {
      console.log("✅ Original page loads successfully");
    } else {
      console.log(`❌ Original page failed: ${originalResponse.status}`);
    }
    
  } catch (error) {
    console.log("❌ Test failed:", error.message);
  }
  
  console.log("\n🎯 SOLUTION SUMMARY:");
  console.log("1. If debug API shows you're authenticated but canAccess=false, the issue is course access logic");
  console.log("2. If debug API shows no session, the issue is authentication");
  console.log("3. Use the optimized page as a temporary fix");
  console.log("4. The root cause is likely in getLearnerCourseDetail function");
}

// Run the test
testCourseAccess();

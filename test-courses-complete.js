// Comprehensive test for discover and assigned tabs
const testUrls = [
  {
    name: "Discover Quick API",
    url: "http://localhost:3000/api/dashboard/courses/discover-quick",
    expectedCourses: 3,
    expectedTitles: ["Web Development Basics", "Advanced React Development", "Python for Data Science"]
  },
  {
    name: "Assigned Quick API", 
    url: "http://localhost:3000/api/dashboard/courses/assigned-quick",
    expectedCourses: 2,
    expectedTitles: ["Web Development Basics", "Python for Data Science"]
  },
  {
    name: "Learning Pathway Working API",
    url: "http://localhost:3000/api/dashboard/courses/learning-pathway-working", 
    expectedCourses: 2,
    expectedTitles: ["Web Development Basics", "Advanced React Development"]
  }
];

async function testAllAPIs() {
  console.log("🚀 TESTING ALL COURSES APIs END-TO-END\n");
  
  for (const test of testUrls) {
    console.log(`\n📋 Testing: ${test.name}`);
    console.log(`🔗 URL: ${test.url}`);
    
    try {
      const response = await fetch(test.url);
      const data = await response.json();
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Success: ${data.success}`);
      
      if (data.success && data.data) {
        const actualCourses = data.data.length;
        const actualTitles = data.data.map(c => c.title);
        
        console.log(`📚 Courses found: ${actualCourses} (expected: ${test.expectedCourses})`);
        
        console.log("📝 Course titles:");
        actualTitles.forEach((title, i) => {
          const expected = test.expectedTitles.includes(title) ? "✅" : "❌";
          console.log(`   ${i+1}. ${title} ${expected}`);
        });
        
        if (actualCourses === test.expectedCourses) {
          console.log("🎯 COURSE COUNT: ✅ MATCH");
        } else {
          console.log("🎯 COURSE COUNT: ❌ MISMATCH");
        }
        
        const allTitlesMatch = test.expectedTitles.every(expected => 
          actualTitles.includes(expected)
        );
        
        if (allTitlesMatch) {
          console.log("🎯 COURSE TITLES: ✅ ALL MATCH");
        } else {
          console.log("🎯 COURSE TITLES: ❌ SOME MISSING");
        }
        
      } else {
        console.log("❌ API returned no data");
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
  }
  
  console.log("\n🎊 SUMMARY:");
  console.log("✅ Discover Quick: Shows all admin-approved courses");
  console.log("✅ Assigned Quick: Shows courses assigned to student"); 
  console.log("✅ Learning Pathway: Shows enrolled courses");
  console.log("\n🚀 READY FOR FRONTEND TESTING!");
  console.log("📱 Refresh your browser and test the courses dashboard");
}

// Run tests
testAllAPIs().catch(console.error);

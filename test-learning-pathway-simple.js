/**
 * Test the simple learning pathway API
 */

async function testSimpleLearningPathwayAPI() {
  console.log('=== TESTING SIMPLE LEARNING PATHWAY API ===');
  
  const testUrl = 'http://localhost:3000/api/dashboard/courses/learning-pathway-working-simple';
  
  try {
    console.log('Testing simple API endpoint:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response OK:', response.ok);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('\n✅ SUCCESS! API Response:');
    console.log('- Has data array:', Array.isArray(data.data));
    console.log('- Data length:', data.data?.length || 0);
    console.log('- Has counts object:', typeof data.counts === 'object');
    console.log('- Has debug info:', typeof data.debug === 'object');
    
    if (data.data && data.data.length > 0) {
      console.log('\n📚 Sample Course Data:');
      const course = data.data[0];
      console.log('- Title:', course.title);
      console.log('- Progress:', course.progress + '%');
      console.log('- Status:', course.status);
      console.log('- Instructor:', course.instructor?.name || 'No instructor');
      console.log('- Category:', course.category);
      console.log('- Next Lesson:', course.nextLesson);
    }
    
    console.log('\n🎉 Simple API Test Complete!');
    console.log('Status: WORKING - No database dependencies');
    
    return true;
    
  } catch (error) {
    console.error('❌ Simple API Test Failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Note: Server is not running.');
      console.log('Start development server with: npm run dev');
      console.log('Then run this test again.');
    }
    
    return false;
  }
}

// Test the API
testSimpleLearningPathwayAPI();

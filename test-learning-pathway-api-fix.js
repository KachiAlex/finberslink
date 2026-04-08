/**
 * Test script to verify learning pathway API fix
 */

async function testLearningPathwayAPI() {
  console.log('=== TESTING LEARNING PATHWAY API FIX ===');
  
  const testUrl = 'http://localhost:3000/api/dashboard/courses/learning-pathway-working';
  
  try {
    console.log('Testing API endpoint:', testUrl);
    
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
    
    console.log('✅ API Response Structure:');
    console.log('- Has data array:', Array.isArray(data.data));
    console.log('- Data length:', data.data?.length || 0);
    console.log('- Has counts object:', typeof data.counts === 'object');
    console.log('- Has debug info:', typeof data.debug === 'object');
    
    if (data.data && data.data.length > 0) {
      console.log('\n✅ Sample Course Data:');
      const course = data.data[0];
      console.log('- ID:', course.id);
      console.log('- Title:', course.title);
      console.log('- Progress:', course.progress + '%');
      console.log('- Status:', course.status);
      console.log('- Instructor:', course.instructor?.name || 'No instructor');
    }
    
    if (data.debug) {
      console.log('\n🔍 Debug Info:');
      console.log('- Message:', data.debug.message);
      console.log('- Timestamp:', data.debug.timestamp);
      if (data.debug.userId) {
        console.log('- User ID:', data.debug.userId);
        console.log('- User Email:', data.debug.userEmail);
      }
      if (data.debug.error) {
        console.log('- Error:', data.debug.error);
      }
    }
    
    // Test data structure compliance
    console.log('\n🧪 Data Structure Validation:');
    
    let validationErrors = [];
    
    if (!Array.isArray(data.data)) {
      validationErrors.push('data should be an array');
    }
    
    if (typeof data.counts !== 'object') {
      validationErrors.push('counts should be an object');
    }
    
    if (data.data && data.data.length > 0) {
      const course = data.data[0];
      const requiredFields = ['id', 'title', 'progress', 'status', 'instructor'];
      
      requiredFields.forEach(field => {
        if (!(field in course)) {
          validationErrors.push(`course missing required field: ${field}`);
        }
      });
    }
    
    if (validationErrors.length === 0) {
      console.log('✅ All validations passed!');
    } else {
      console.log('❌ Validation errors:');
      validationErrors.forEach(error => console.log('  -', error));
    }
    
    console.log('\n🎉 API Test Complete!');
    console.log('Status:', response.ok ? 'WORKING' : 'FAILED');
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Note: Server is not running.');
      console.log('Start the development server with: npm run dev');
      console.log('Then run this test again.');
    }
  }
}

// Test the API
testLearningPathwayAPI();

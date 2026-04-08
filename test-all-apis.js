// Comprehensive API test script
// Run with: node test-all-apis.js
// Make sure your dev server is running on localhost:3000

const http = require('http');

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testAPI(name, path, method = 'GET', body = null) {
  console.log(`\n=== TESTING ${name} ===`);
  console.log(`Request: ${method} ${path}`);
  
  try {
    const response = await makeRequest(path, method, body);
    
    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ SUCCESS');
      
      if (response.data.data && Array.isArray(response.data.data)) {
        console.log(`Found ${response.data.data.length} items`);
        
        if (response.data.data.length > 0) {
          console.log('First item:', JSON.stringify(response.data.data[0], null, 2).substring(0, 300) + '...');
        }
      } else if (response.data.success) {
        console.log('✅ Operation successful');
        console.log('Response:', JSON.stringify(response.data, null, 2).substring(0, 300) + '...');
      }
    } else {
      console.log('❌ FAILED');
      console.log('Error:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log('❌ ERROR');
    console.log('Error:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 STARTING COMPREHENSIVE API TESTS');
  console.log('Make sure your dev server is running on localhost:3000\n');
  
  // Test 1: Server Status
  await testAPI('Server Status', '/api/debug/server-status');
  
  // Test 2: Discover API (should show 3 courses)
  await testAPI('Discover Courses', '/api/dashboard/courses/discover-working');
  
  // Test 3: Learning Pathway API (should be empty initially)
  await testAPI('Learning Pathway', '/api/dashboard/courses/learning-pathway-working');
  
  // Test 4: Assigned Courses API
  await testAPI('Assigned Courses', '/api/dashboard/courses/assigned-no-auth');
  
  // Test 5: Get Enrollments API
  await testAPI('Get Enrollments', '/api/enrollments-working');
  
  // Test 6: Create Assignments (setup BA with AI and Soft Skills)
  await testAPI('Create Assignments', '/api/debug/create-assignments', 'POST');
  
  // Test 7: Test Enrollment (enroll in first course)
  console.log('\n=== TESTING ENROLLMENT ===');
  try {
    // First get a course to enroll in
    const discoverResponse = await makeRequest('/api/dashboard/courses/discover-working');
    if (discoverResponse.status === 200 && discoverResponse.data.data && discoverResponse.data.data.length > 0) {
      const firstCourse = discoverResponse.data.data[0];
      console.log(`Enrolling in course: ${firstCourse.title}`);
      
      const enrollmentResponse = await makeRequest('/api/enrollments-working', 'POST', {
        courseId: firstCourse.id
      });
      
      if (enrollmentResponse.status === 200) {
        console.log('✅ ENROLLMENT SUCCESSFUL');
        console.log('Response:', JSON.stringify(enrollmentResponse.data, null, 2).substring(0, 300) + '...');
      } else {
        console.log('❌ ENROLLMENT FAILED');
        console.log('Error:', JSON.stringify(enrollmentResponse.data, null, 2));
      }
    } else {
      console.log('❌ Could not get courses for enrollment test');
    }
  } catch (error) {
    console.log('❌ ENROLLMENT ERROR');
    console.log('Error:', error.message);
  }
  
  // Test 8: Check Learning Pathway after enrollment
  await testAPI('Learning Pathway (After Enrollment)', '/api/dashboard/courses/learning-pathway-working');
  
  // Test 9: Get Enrollments after enrollment
  await testAPI('Get Enrollments (After Enrollment)', '/api/enrollments-working');
  
  console.log('\n🎉 ALL TESTS COMPLETED');
  console.log('\nSUMMARY:');
  console.log('1. Server should be running and accessible');
  console.log('2. Discover API should show 3 courses');
  console.log('3. Learning Pathway should be empty initially, then show enrolled courses');
  console.log('4. Enrollment should create actual database records');
  console.log('5. All APIs should return proper JSON responses');
}

// Run the tests
runAllTests().catch(console.error);

/**
 * Browser Console Test for Admin Course Endpoints
 * Copy and paste this into the browser console when logged in as an admin
 */

// Test course ID - replace with actual course ID from your debug endpoint
const TEST_COURSE_ID = 'cmnn9y2sg000004lamgela815';

async function testAdminEndpoint(name, url, body = null) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`📡 URL: ${url}`);
  
  try {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
      console.log(`📦 Body: ${JSON.stringify(body)}`);
    }
    
    const response = await fetch(url, options);
    const status = response.status;
    const text = await response.text();
    
    console.log(`📊 Status: ${status}`);
    console.log(`📄 Response: ${text}`);
    
    if (status >= 200 && status < 300) {
      console.log(`✅ ${name} - SUCCESS`);
      return true;
    } else {
      console.log(`❌ ${name} - FAILED`);
      return false;
    }
  } catch (error) {
    console.log(`💥 ${name} - ERROR: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Testing Admin Course Endpoints (Browser Console)');
  console.log(`🆔 Test Course ID: ${TEST_COURSE_ID}`);
  console.log('👤 Make sure you are logged in as an admin!');
  
  const tests = [
    {
      name: 'Archive Course',
      url: `/api/admin/courses/${TEST_COURSE_ID}/archive`
    },
    {
      name: 'Restore Course', 
      url: `/api/admin/courses/${TEST_COURSE_ID}/restore`
    },
    {
      name: 'Update Status to APPROVED',
      url: `/api/admin/courses/${TEST_COURSE_ID}/status`,
      body: { status: 'APPROVED' }
    },
    {
      name: 'Update Status to PENDING',
      url: `/api/admin/courses/${TEST_COURSE_ID}/status`,
      body: { status: 'PENDING' }
    },
    {
      name: 'Update Status to CHANGES',
      url: `/api/admin/courses/${TEST_COURSE_ID}/status`,
      body: { status: 'CHANGES' }
    },
    {
      name: 'Approve Edit',
      url: `/api/admin/courses/${TEST_COURSE_ID}/approve-edit`
    },
    {
      name: 'Reject Edit',
      url: `/api/admin/courses/${TEST_COURSE_ID}/reject-edit`
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await testAdminEndpoint(test.name, test.url, test.body);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📈 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All admin course endpoints are working correctly!');
  } else {
    console.log('\n⚠️  Some endpoints failed. Check the logs above.');
  }
}

// Auto-run the tests
console.log('🔧 Admin Course Endpoint Test Script Loaded');
console.log('💡 Run runAllTests() to test all endpoints');
console.log('💡 Or run individual tests with testAdminEndpoint()');

// Uncomment the line below to run tests immediately
// runAllTests();

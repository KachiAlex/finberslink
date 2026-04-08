#!/usr/bin/env node

/**
 * Test script for admin course management endpoints
 * Tests: archive, restore, approve-edit, reject-edit, status
 */

const BASE_URL = process.env.BASE_URL || 'https://finbers-link.vercel.app';

// Test course ID (you'll need to replace this with an actual course ID)
const TEST_COURSE_ID = 'cmnn9y2sg000004lamgela815'; // From your logs

const endpoints = [
  {
    name: 'Archive Course',
    url: `${BASE_URL}/api/admin/courses/${TEST_COURSE_ID}/archive`,
    method: 'POST',
    expectedStatus: 200
  },
  {
    name: 'Restore Course', 
    url: `${BASE_URL}/api/admin/courses/${TEST_COURSE_ID}/restore`,
    method: 'POST',
    expectedStatus: 200
  },
  {
    name: 'Update Status to APPROVED',
    url: `${BASE_URL}/api/admin/courses/${TEST_COURSE_ID}/status`,
    method: 'POST',
    body: { status: 'APPROVED' },
    expectedStatus: 200
  },
  {
    name: 'Update Status to PENDING',
    url: `${BASE_URL}/api/admin/courses/${TEST_COURSE_ID}/status`,
    method: 'POST', 
    body: { status: 'PENDING' },
    expectedStatus: 200
  },
  {
    name: 'Update Status to CHANGES',
    url: `${BASE_URL}/api/admin/courses/${TEST_COURSE_ID}/status`,
    method: 'POST',
    body: { status: 'CHANGES' },
    expectedStatus: 200
  },
  {
    name: 'Approve Edit',
    url: `${BASE_URL}/api/admin/courses/${TEST_COURSE_ID}/approve-edit`,
    method: 'POST',
    expectedStatus: 200
  },
  {
    name: 'Reject Edit',
    url: `${BASE_URL}/api/admin/courses/${TEST_COURSE_ID}/reject-edit`,
    method: 'POST',
    expectedStatus: 200
  }
];

async function testEndpoint(endpoint) {
  console.log(`\n🧪 Testing: ${endpoint.name}`);
  console.log(`📡 URL: ${endpoint.url}`);
  
  try {
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (endpoint.body) {
      options.body = JSON.stringify(endpoint.body);
      console.log(`📦 Body: ${JSON.stringify(endpoint.body)}`);
    }
    
    const response = await fetch(endpoint.url, options);
    const status = response.status;
    const text = await response.text();
    
    console.log(`📊 Status: ${status}`);
    console.log(`📄 Response: ${text}`);
    
    if (status === endpoint.expectedStatus) {
      console.log(`✅ ${endpoint.name} - PASSED`);
      return true;
    } else {
      console.log(`❌ ${endpoint.name} - FAILED (expected ${endpoint.expectedStatus}, got ${status})`);
      return false;
    }
  } catch (error) {
    console.log(`💥 ${endpoint.name} - ERROR: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Admin Course API Endpoint Tests');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`🆔 Test Course ID: ${TEST_COURSE_ID}`);
  
  let passed = 0;
  let failed = 0;
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('\n📈 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Admin course endpoints are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the endpoints.');
  }
}

// Check if we have a course ID
if (!TEST_COURSE_ID || TEST_COURSE_ID === 'your-course-id-here') {
  console.log('❌ Please update TEST_COURSE_ID with an actual course ID from your database');
  console.log('💡 You can find course IDs in the debug endpoint response');
  process.exit(1);
}

runTests().catch(console.error);

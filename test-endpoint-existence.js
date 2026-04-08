#!/usr/bin/env node

/**
 * Simple test to check if admin course endpoints exist and are reachable
 * This tests endpoint availability without requiring authentication
 */

const BASE_URL = process.env.BASE_URL || 'https://finbers-link.vercel.app';
const TEST_COURSE_ID = 'cmnn9y2sg000004lamgela815';

const endpoints = [
  {
    name: 'Archive Course',
    url: `${BASE_URL}/api/admin/courses/${TEST_COURSE_ID}/archive`,
    method: 'POST'
  },
  {
    name: 'Restore Course', 
    url: `${BASE_URL}/api/admin/courses/${TEST_COURSE_ID}/restore`,
    method: 'POST'
  },
  {
    name: 'Update Status',
    url: `${BASE_URL}/api/admin/courses/${TEST_COURSE_ID}/status`,
    method: 'POST'
  },
  {
    name: 'Approve Edit',
    url: `${BASE_URL}/api/admin/courses/${TEST_COURSE_ID}/approve-edit`,
    method: 'POST'
  },
  {
    name: 'Reject Edit',
    url: `${BASE_URL}/api/admin/courses/${TEST_COURSE_ID}/reject-edit`,
    method: 'POST'
  }
];

async function testEndpointExists(endpoint) {
  console.log(`\n🧪 Testing: ${endpoint.name}`);
  console.log(`📡 URL: ${endpoint.url}`);
  
  try {
    const response = await fetch(endpoint.url, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const status = response.status;
    const text = await response.text();
    
    console.log(`📊 Status: ${status}`);
    
    // Check if endpoint exists (status should not be 404)
    if (status === 404) {
      console.log(`❌ ${endpoint.name} - NOT FOUND (404)`);
      return false;
    } else if (status === 500 && text.includes('Not authenticated')) {
      console.log(`✅ ${endpoint.name} - EXISTS (authentication required)`);
      return true;
    } else if (status === 401 || status === 403) {
      console.log(`✅ ${endpoint.name} - EXISTS (authentication required)`);
      return true;
    } else {
      console.log(`✅ ${endpoint.name} - EXISTS (status: ${status})`);
      console.log(`📄 Response: ${text.substring(0, 100)}...`);
      return true;
    }
  } catch (error) {
    console.log(`💥 ${endpoint.name} - ERROR: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Testing Admin Course API Endpoint Availability');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`🆔 Test Course ID: ${TEST_COURSE_ID}`);
  
  let exists = 0;
  let notFound = 0;
  
  for (const endpoint of endpoints) {
    const result = await testEndpointExists(endpoint);
    if (result) {
      exists++;
    } else {
      notFound++;
    }
  }
  
  console.log('\n📈 Results:');
  console.log(`✅ Endpoints exist: ${exists}`);
  console.log(`❌ Endpoints missing: ${notFound}`);
  console.log(`📊 Total: ${exists + notFound}`);
  
  if (notFound === 0) {
    console.log('\n🎉 All admin course endpoints exist and are reachable!');
    console.log('🔐 They require authentication, which is expected.');
  } else {
    console.log('\n⚠️  Some endpoints are missing. Please check deployment.');
  }
}

runTests().catch(console.error);

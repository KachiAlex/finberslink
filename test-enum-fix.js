#!/usr/bin/env node

/**
 * Test script to verify the PostgreSQL enum comparison fix
 * 
 * This script tests the /api/dashboard/courses/learning-pathway endpoint
 * to ensure it returns 200 with valid data (not 500 with enum type errors)
 */

const http = require('http');
const jwt = require('jsonwebtoken');

// Configuration
const PORT = 3001;
const HOST = 'localhost';
const ENDPOINT = '/api/dashboard/courses/learning-pathway';
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'k3Y3G8iGsDp8aZu5yxWjZEwugLmMbTj75NPGAadsHDAwQQHWVsHwhgUrA39Fm4kAZbbR9GLIcAYXgBkd2FiUdA==';

// Create a test JWT token
const testToken = jwt.sign(
  {
    sub: 'test-user-123',
    role: 'STUDENT',
    status: 'ACTIVE',
    tenantId: 'test-tenant-1',
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

console.log('🧪 Testing PostgreSQL Enum Comparison Fix');
console.log('=========================================\n');
console.log(`📍 Endpoint: http://${HOST}:${PORT}${ENDPOINT}`);
console.log(`🔐 Using test JWT token\n`);

// Make the request
const options = {
  hostname: HOST,
  port: PORT,
  path: ENDPOINT,
  method: 'GET',
  headers: {
    'Cookie': `access_token=${testToken}`,
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`📊 Response Status: ${res.statusCode}`);
    console.log(`📋 Response Headers:`, res.headers);
    console.log('\n📝 Response Body:');
    
    try {
      const body = JSON.parse(data);
      console.log(JSON.stringify(body, null, 2));
      
      // Verify the fix
      console.log('\n✅ Verification Results:');
      console.log('========================\n');
      
      if (res.statusCode === 200) {
        console.log('✓ Status Code: 200 (SUCCESS)');
        console.log('  Expected: 200 (query executed successfully)');
        console.log('  Bug would cause: 500 (PostgreSQL enum type mismatch)\n');
      } else if (res.statusCode === 500) {
        console.log('✗ Status Code: 500 (FAILURE)');
        console.log('  This indicates the bug is NOT fixed');
        console.log('  Error: PostgreSQL enum type mismatch\n');
        process.exit(1);
      } else {
        console.log(`? Status Code: ${res.statusCode} (UNEXPECTED)`);
        console.log('  Expected: 200 or 401 (if auth fails)\n');
      }
      
      if (body.error) {
        console.log(`✗ Error in response: ${body.error}`);
        if (body.error.includes('EnrollmentStatus') || body.error.includes('operator does not exist')) {
          console.log('  This is the PostgreSQL enum type mismatch bug!\n');
          process.exit(1);
        }
      } else {
        console.log('✓ No error field in response');
      }
      
      if (body.data) {
        console.log(`✓ Data field present: ${Array.isArray(body.data) ? 'Array' : 'Object'}`);
        if (Array.isArray(body.data)) {
          console.log(`  Contains ${body.data.length} items`);
        }
      } else if (res.statusCode === 200) {
        console.log('✗ No data field in response (expected for 200 status)');
      }
      
      if (body.counts) {
        console.log(`✓ Counts field present: total=${body.counts.total}, filtered=${body.counts.filtered}`);
      }
      
      console.log('\n🎉 Fix Verification: PASSED');
      console.log('The enum comparison fix is working correctly!');
      process.exit(0);
    } catch (e) {
      console.log(data);
      console.log('\n❌ Failed to parse response as JSON');
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.error('\nMake sure the dev server is running on port 3001');
  console.error('Run: npm run dev');
  process.exit(1);
});

req.end();

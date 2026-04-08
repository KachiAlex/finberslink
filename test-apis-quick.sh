#!/bin/bash

echo "🚀 TESTING ALL API ENDPOINTS"
echo "Make sure your dev server is running on localhost:3000"
echo ""

# Test 1: Server Status
echo "=== 1. Server Status ==="
curl -s http://localhost:3000/api/debug/server-status | head -c 200
echo ""
echo ""

# Test 2: Discover Courses
echo "=== 2. Discover Courses (should show 3 courses) ==="
curl -s http://localhost:3000/api/dashboard/courses/discover-working | jq '.data | length' 2>/dev/null || echo "API call failed"
echo ""

# Test 3: Learning Pathway
echo "=== 3. Learning Pathway (should be empty initially) ==="
curl -s http://localhost:3000/api/dashboard/courses/learning-pathway-working | jq '.data | length' 2>/dev/null || echo "API call failed"
echo ""

# Test 4: Assigned Courses
echo "=== 4. Assigned Courses ==="
curl -s http://localhost:3000/api/dashboard/courses/assigned-no-auth | jq '.data | length' 2>/dev/null || echo "API call failed"
echo ""

# Test 5: Get Enrollments
echo "=== 5. Get Enrollments ==="
curl -s http://localhost:3000/api/enrollments-working | jq '.data | length' 2>/dev/null || echo "API call failed"
echo ""

# Test 6: Create Assignments
echo "=== 6. Create Assignments (BA with AI, Soft Skills) ==="
curl -s -X POST http://localhost:3000/api/debug/create-assignments | jq '.success' 2>/dev/null || echo "API call failed"
echo ""

echo "✅ Quick tests completed!"
echo "For detailed testing, run: node test-all-apis.js"

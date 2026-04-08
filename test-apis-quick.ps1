# PowerShell script to test all API endpoints
# Run with: .\test-apis-quick.ps1

Write-Host "🚀 TESTING ALL API ENDPOINTS" -ForegroundColor Green
Write-Host "Make sure your dev server is running on localhost:3000" -ForegroundColor Yellow
Write-Host ""

# Test 1: Server Status
Write-Host "=== 1. Server Status ===" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/debug/server-status" -Method GET
    Write-Host "✅ Server is running" -ForegroundColor Green
    Write-Host "Uptime: $($response.uptime) seconds"
} catch {
    Write-Host "❌ Server not accessible" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
}
Write-Host ""

# Test 2: Discover Courses
Write-Host "=== 2. Discover Courses (should show 3 courses) ===" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/dashboard/courses/discover-working" -Method GET
    Write-Host "✅ Found $($response.data.length) courses" -ForegroundColor Green
    $response.data | ForEach-Object { Write-Host "  • $($_.title) - $($_.level) - $($_.category)" }
} catch {
    Write-Host "❌ Discover API failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
}
Write-Host ""

# Test 3: Learning Pathway
Write-Host "=== 3. Learning Pathway (should be empty initially) ===" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/dashboard/courses/learning-pathway-working" -Method GET
    Write-Host "✅ Found $($response.data.length) enrolled courses" -ForegroundColor Green
    if ($response.data.length -gt 0) {
        $response.data | ForEach-Object { Write-Host "  • $($_.title) - $($_.progress)% complete" }
    } else {
        Write-Host "  (No enrollments yet - this is expected)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Learning Pathway API failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
}
Write-Host ""

# Test 4: Assigned Courses
Write-Host "=== 4. Assigned Courses ===" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/dashboard/courses/assigned-no-auth" -Method GET
    Write-Host "✅ Found $($response.data.length) assigned courses" -ForegroundColor Green
    if ($response.data.length -gt 0) {
        $response.data | ForEach-Object { Write-Host "  • $($_.title)" }
    } else {
        Write-Host "  (No assigned courses - this is expected)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Assigned Courses API failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
}
Write-Host ""

# Test 5: Get Enrollments
Write-Host "=== 5. Get Enrollments ===" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/enrollments-working" -Method GET
    Write-Host "✅ Found $($response.data.length) enrollments" -ForegroundColor Green
    if ($response.data.length -gt 0) {
        $response.data | ForEach-Object { Write-Host "  • $($_.course.title) - $($_.status)" }
    } else {
        Write-Host "  (No enrollments yet - this is expected)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Get Enrollments API failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
}
Write-Host ""

# Test 6: Create Assignments
Write-Host "=== 6. Create Assignments (BA with AI, Soft Skills) ===" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/debug/create-assignments" -Method POST
    Write-Host "✅ Assignments created: $($response.success)" -ForegroundColor Green
    $response.assignments | ForEach-Object { Write-Host "  • $($_.courseTitle) - $($_.status)" }
} catch {
    Write-Host "❌ Create Assignments API failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
}
Write-Host ""

# Test 7: Test Enrollment (if we have courses)
Write-Host "=== 7. Test Enrollment ===" -ForegroundColor Cyan
try {
    # Get first available course
    $discoverResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/dashboard/courses/discover-working" -Method GET
    if ($discoverResponse.data.length -gt 0) {
        $firstCourse = $discoverResponse.data[0]
        Write-Host "Attempting to enroll in: $($firstCourse.title)" -ForegroundColor Yellow
        
        $enrollmentResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/enrollments-working" -Method POST -ContentType "application/json" -Body (@{ courseId = $firstCourse.id } | ConvertTo-Json)
        
        if ($enrollmentResponse.success) {
            Write-Host "✅ Enrollment successful!" -ForegroundColor Green
            Write-Host "  Course: $($enrollmentResponse.course.title)"
            Write-Host "  User: $($enrollmentResponse.user.name)"
        } else {
            Write-Host "❌ Enrollment failed: $($enrollmentResponse.error)" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ No courses available for enrollment test" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Enrollment test failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
}
Write-Host ""

# Test 8: Check Learning Pathway after enrollment
Write-Host "=== 8. Learning Pathway (After Enrollment) ===" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/dashboard/courses/learning-pathway-working" -Method GET
    Write-Host "✅ Found $($response.data.length) enrolled courses" -ForegroundColor Green
    $response.data | ForEach-Object { Write-Host "  • $($_.title) - $($_.progress)% complete - $($_.status)" }
} catch {
    Write-Host "❌ Learning Pathway API failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
}
Write-Host ""

Write-Host "🎉 ALL TESTS COMPLETED" -ForegroundColor Green
Write-Host ""
Write-Host "SUMMARY:" -ForegroundColor Yellow
Write-Host "1. Server should be running and accessible" -ForegroundColor White
Write-Host "2. Discover API should show 3 courses" -ForegroundColor White
Write-Host "3. Learning Pathway should show enrolled courses after enrollment" -ForegroundColor White
Write-Host "4. Enrollment should create actual database records" -ForegroundColor White
Write-Host "5. All APIs should return proper JSON responses" -ForegroundColor White
Write-Host ""
Write-Host "For detailed testing, run: node test-all-apis.js" -ForegroundColor Gray

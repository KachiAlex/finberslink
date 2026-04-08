/**
 * Clear Courses Database Script
 * Browser console script to clear all courses and start fresh
 */

async function clearCoursesDatabase() {
  console.log('🧹 Starting courses database cleanup...');
  
  if (!confirm('⚠️ WARNING: This will permanently delete ALL courses, lessons, enrollments, and progress data. This action cannot be undone!\n\nAre you sure you want to continue?')) {
    console.log('❌ Database cleanup cancelled by user');
    return;
  }
  
  if (!confirm('🚨 FINAL WARNING: All course data will be permanently deleted. This includes:\n\n• All courses\n• All lessons and sections\n• All student enrollments\n• All progress data\n• All course-related achievements\n\nType "DELETE ALL COURSES" to confirm:')) {
    console.log('❌ Database cleanup cancelled by user');
    return;
  }
  
  const finalConfirmation = prompt('Type "DELETE ALL COURSES" to proceed:');
  if (finalConfirmation !== 'DELETE ALL COURSES') {
    console.log('❌ Incorrect confirmation. Database cleanup cancelled.');
    return;
  }
  
  try {
    console.log('🔄 Sending database cleanup request...');
    
    const response = await fetch('/api/admin/courses/clear-database', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Database cleanup successful!');
      console.log('📊 Cleanup Summary:');
      console.log('   - Courses deleted:', data.deletedRecords.courses);
      console.log('   - Enrollments deleted:', data.deletedRecords.enrollments);
      console.log('   - Course sections deleted:', data.deletedRecords.courseSections);
      console.log('   - Lessons deleted:', data.deletedRecords.lessons);
      console.log('   - Lesson progress deleted:', data.deletedRecords.lessonProgress);
      console.log('   - Student achievements deleted:', data.deletedRecords.studentAchievements);
      console.log('   - Course progress deleted:', data.deletedRecords.courseProgress);
      console.log('   - Total records deleted:', data.totalDeleted);
      console.log('   - Records remaining:', data.totalRemaining);
      console.log('   - Verification:', data.verification);
      
      alert(`✅ Successfully cleared courses database!\n\nDeleted ${data.totalDeleted} records.\n\nThe page will now reload to reflect the changes.`);
      
      // Reload page after successful cleanup
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } else {
      console.error('❌ Database cleanup failed:', data.error);
      alert('Failed to clear courses database: ' + data.error);
    }
    
  } catch (error) {
    console.error('💥 Database cleanup error:', error);
    alert('An error occurred during database cleanup: ' + error.message);
  }
}

async function checkCoursesDatabaseState() {
  console.log('📊 Checking current courses database state...');
  
  try {
    const response = await fetch('/api/admin/courses/clear-database');
    const data = await response.json();
    
    console.log('📈 Current Database State:');
    console.log('   - Courses:', data.counts.courses);
    console.log('   - Enrollments:', data.counts.enrollments);
    console.log('   - Course sections:', data.counts.courseSections);
    console.log('   - Lessons:', data.counts.lessons);
    console.log('   - Lesson progress:', data.counts.lessonProgress);
    console.log('   - Student achievements:', data.counts.studentAchievements);
    console.log('   - Course progress:', data.counts.courseProgress);
    console.log('   - Is empty:', data.isEmpty);
    
    if (data.sampleCourses && data.sampleCourses.length > 0) {
      console.log('📚 Sample courses:');
      data.sampleCourses.forEach(course => {
        console.log(`   - ${course.title} (${course.id}) - ${course.approvalStatus}`);
      });
    }
    
    return data;
    
  } catch (error) {
    console.error('💥 Failed to check database state:', error);
    alert('Failed to check database state: ' + error.message);
  }
}

console.log('🔧 Courses Database Management Script Loaded');
console.log('💡 Available commands:');
console.log('   - checkCoursesDatabaseState() - Check current database state');
console.log('   - clearCoursesDatabase() - Clear all courses and related data');
console.log('⚠️ WARNING: clearCoursesDatabase() will permanently delete ALL course data!');

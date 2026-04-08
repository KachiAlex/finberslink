/**
 * Browser Console Script for Course Deduplication
 * Removes duplicate courses with same IDs from database
 */

async function deduplicateCourses() {
  console.log('🧹 Starting course deduplication...');
  
  try {
    const response = await fetch('/api/admin/courses/deduplicate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Deduplication successful!');
      console.log(`📊 Results:`);
      console.log(`   - Total courses: ${data.stats.total}`);
      console.log(`   - Archived courses: ${data.stats.archived}`);
      console.log(`   - Approved courses: ${data.stats.approved}`);
      console.log(`   - Duplicates removed: ${data.duplicatesRemoved.length}`);
      
      if (data.duplicatesRemoved.length > 0) {
        console.log(`🗑️ Removed duplicate courses:`, data.duplicatesRemoved);
        alert(`Successfully removed ${data.duplicatesRemoved.length} duplicate courses! Refresh the admin page.`);
      } else {
        console.log('✨ No duplicates found - database is clean!');
        alert('No duplicate courses found. Database is already clean!');
      }
    } else {
      console.error('❌ Deduplication failed:', data.error);
      alert('Failed to deduplicate courses: ' + data.error);
    }
  } catch (error) {
    console.error('💥 Deduplication error:', error);
    alert('An error occurred during deduplication. Check console for details.');
  }
}

console.log('🔧 Course Deduplication Script Loaded');
console.log('💡 Run deduplicateCourses() to remove duplicate courses');
console.log('💡 This will:');
console.log('   1. Find courses with duplicate IDs');
console.log('   2. Keep the most recently updated version');
console.log('   3. Remove older duplicates');
console.log('   4. Clean up related data (enrollments, lessons, sections)');
console.log('   5. Provide detailed results');

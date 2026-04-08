/**
 * Simple Course Deduplication Script
 * Finds and removes duplicate courses using existing debug endpoint
 */

async function deduplicateCoursesSimple() {
  console.log('🧹 Starting simple course deduplication...');
  
  try {
    // First, get all courses to analyze duplicates
    const debugResponse = await fetch('/api/admin/courses/debug');
    const debugData = await debugResponse.json();
    
    if (!debugData.allCourses) {
      throw new Error('Could not fetch course data');
    }
    
    console.log(`📊 Found ${debugData.allCourses.length} total courses`);
    
    // Group courses by ID to find duplicates
    const courseGroups = new Map();
    const duplicatesToRemove = [];
    
    debugData.allCourses.forEach(course => {
      const id = course.id;
      if (!courseGroups.has(id)) {
        courseGroups.set(id, [course]);
      } else {
        courseGroups.get(id).push(course);
      }
    });
    
    // Find duplicates
    courseGroups.forEach((courses, id) => {
      if (courses.length > 1) {
        console.log(`🔍 Found duplicate group for ID ${id}: ${courses.length} courses`);
        
        // Sort by updatedAt (most recent first)
        courses.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        
        // Keep first (most recent), mark others for removal
        const [keep, ...toRemove] = courses;
        console.log(`   Keeping: ${keep.title} (${new Date(keep.updatedAt).toLocaleString()})`);
        
        toRemove.forEach(course => {
          console.log(`   Removing: ${course.title} (${new Date(course.updatedAt).toLocaleString()})`);
          duplicatesToRemove.push(course.id);
        });
      }
    });
    
    console.log(`🗑️ Found ${duplicatesToRemove.length} duplicates to remove`);
    
    if (duplicatesToRemove.length === 0) {
      console.log('✨ No duplicates found - database is clean!');
      alert('No duplicate courses found. Database is already clean!');
      return;
    }
    
    // Remove duplicates using existing archive/restore endpoints
    let removedCount = 0;
    for (const courseId of duplicatesToRemove) {
      try {
        // First archive the course
        const archiveResponse = await fetch(`/api/admin/courses/${courseId}/archive`, {
          method: 'POST'
        });
        
        if (archiveResponse.ok) {
          console.log(`✅ Archived duplicate course: ${courseId}`);
          removedCount++;
        } else {
          console.log(`❌ Failed to archive ${courseId}:`, await archiveResponse.text());
        }
      } catch (error) {
        console.log(`💥 Error removing ${courseId}:`, error.message);
      }
    }
    
    console.log(`🎉 Successfully processed ${removedCount} duplicate courses!`);
    alert(`Successfully processed ${removedCount} duplicate courses! Refresh the admin page to see results.`);
    
  } catch (error) {
    console.error('💥 Deduplication error:', error);
    alert('An error occurred during deduplication: ' + error.message);
  }
}

console.log('🔧 Simple Course Deduplication Script Loaded');
console.log('💡 Run deduplicateCoursesSimple() to remove duplicate courses');
console.log('💡 This uses existing endpoints to identify and archive duplicates');

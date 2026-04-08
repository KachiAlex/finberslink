/**
 * Ultra Simple Course Deduplication Script
 * Uses basic admin courses endpoint to find and remove duplicates
 */

async function deduplicateCoursesUltraSimple() {
  console.log('🧹 Starting ultra simple course deduplication...');
  
  try {
    // Try to get courses from the main admin courses page
    const coursesResponse = await fetch('/api/admin/courses');
    const coursesData = await coursesResponse.json();
    
    console.log('📊 Course data response:', coursesData);
    
    // If that fails, try to get archived courses
    let allCourses = [];
    
    if (coursesData && Array.isArray(coursesData)) {
      allCourses = coursesData;
      console.log(`✅ Got ${allCourses.length} courses from main endpoint`);
    } else {
      console.log('🔄 Trying archived courses endpoint...');
      const archivedResponse = await fetch('/api/admin/courses/archived');
      const archivedData = await archivedResponse.json();
      
      if (archivedData && Array.isArray(archivedData)) {
        allCourses = archivedData;
        console.log(`✅ Got ${allCourses.length} courses from archived endpoint`);
      } else {
        throw new Error('Could not fetch course data from any endpoint');
      }
    }
    
    // Group courses by ID to find duplicates
    const courseGroups = new Map();
    const duplicatesToRemove = [];
    
    allCourses.forEach(course => {
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
    
    // Remove duplicates using existing archive endpoint
    let removedCount = 0;
    for (const courseId of duplicatesToRemove) {
      try {
        const archiveResponse = await fetch(`/api/admin/courses/${courseId}/archive`, {
          method: 'POST'
        });
        
        if (archiveResponse.ok) {
          console.log(`✅ Archived duplicate course: ${courseId}`);
          removedCount++;
        } else {
          const errorText = await archiveResponse.text();
          console.log(`❌ Failed to archive ${courseId}:`, errorText);
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

console.log('🔧 Ultra Simple Course Deduplication Script Loaded');
console.log('💡 Run deduplicateCoursesUltraSimple() to remove duplicate courses');
console.log('💡 This uses basic admin endpoints to identify and archive duplicates');

/**
 * Browser Console Script to Find and Remove Duplicate Courses
 * Run this in the browser console when logged in as an admin
 */

async function findDuplicates() {
  console.log('🔍 Finding duplicate courses...');
  
  try {
    const response = await fetch('/api/admin/courses/find-duplicates');
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Error:', data.error);
      return;
    }
    
    console.log('📊 Course Analysis Results:');
    console.log(`Total courses: ${data.totalCourses}`);
    console.log(`Exact duplicates: ${data.duplicateCount}`);
    console.log(`Similar titles: ${data.similarTitleCount}`);
    console.log(`Unique courses: ${data.summary.uniqueCourses}`);
    
    if (data.duplicateGroups.length > 0) {
      console.log('\n🔄 EXACT DUPLICATES FOUND:');
      data.duplicateGroups.forEach((dup, index) => {
        console.log(`\n${index + 1}. "${dup.original.title}" by ${dup.original.instructor.firstName} ${dup.original.instructor.lastName}`);
        console.log(`   Original: ${dup.original.id} (created: ${new Date(dup.original.createdAt).toLocaleDateString()})`);
        console.log(`   Duplicate: ${dup.duplicate.id} (created: ${new Date(dup.duplicate.createdAt).toLocaleDateString()})`);
        console.log(`   Enrollments: ${dup.original._count.enrollments} vs ${dup.duplicate._count.enrollments}`);
      });
    }
    
    if (data.similarTitleGroups.length > 0) {
      console.log('\n🔤 SIMILAR TITLES FOUND:');
      data.similarTitleGroups.forEach((sim, index) => {
        console.log(`\n${index + 1}. Similar titles:`);
        console.log(`   "${sim.course1.title}" by ${sim.course1.instructor.firstName} ${sim.course1.instructor.lastName}`);
        console.log(`   "${sim.course2.title}" by ${sim.course2.instructor.firstName} ${sim.course2.instructor.lastName}`);
        console.log(`   Similarity: ${sim.similarity}`);
      });
    }
    
    return data;
  } catch (error) {
    console.error('💥 Error finding duplicates:', error);
  }
}

async function removeDuplicates(duplicateIds, keepIds, dryRun = true) {
  console.log(`🗑️ ${dryRun ? 'DRY RUN: ' : ''}Removing duplicate courses...`);
  
  try {
    const response = await fetch('/api/admin/courses/remove-duplicates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        duplicateIds,
        keepIds,
        dryRun
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Error:', data.error);
      return;
    }
    
    if (dryRun) {
      console.log('🔍 DRY RUN RESULTS:');
      console.log(`Would remove ${data.coursesToRemove.length} courses:`);
      data.wouldRemove.forEach(course => {
        console.log(`   - "${course.title}" (${course.id})`);
        console.log(`     Instructor: ${course.instructor.firstName} ${course.instructor.lastName}`);
        console.log(`     Enrollments: ${course._count.enrollments}`);
        console.log(`     Status: ${course.approvalStatus}`);
      });
      
      console.log(`\nWould keep ${data.coursesToKeep.length} courses:`);
      data.wouldKeep.forEach(course => {
        console.log(`   - "${course.title}" (${course.id})`);
        console.log(`     Enrollments: ${course._count.enrollments}`);
      });
      
      console.log(`\n📊 Summary:`);
      console.log(`   Total enrollments affected: ${data.summary.totalEnrollmentsAffected}`);
      console.log(`   Total lessons affected: ${data.summary.totalLessonsAffected}`);
    } else {
      console.log('✅ DUPLICATES REMOVED:');
      console.log(`Removed ${data.removed} courses`);
      data.removedCourses.forEach(course => {
        console.log(`   - "${course.title}" (${course.id})`);
      });
      console.log(`Kept ${data.keptCourses.length} courses`);
    }
    
    return data;
  } catch (error) {
    console.error('💥 Error removing duplicates:', error);
  }
}

// Helper function to automatically suggest which courses to remove
function suggestRemovals(duplicateData) {
  const suggestions = [];
  
  duplicateData.duplicateGroups.forEach(dup => {
    // Keep the one with enrollments, or the older one if no enrollments
    const toKeep = dup.original._count.enrollments > dup.duplicate._count.enrollments 
      ? dup.original 
      : dup.duplicate._count.enrollments > dup.original._count.enrollments
      ? dup.duplicate
      : new Date(dup.original.createdAt) < new Date(dup.duplicate.createdAt)
      ? dup.original
      : dup.duplicate;
    
    const toRemove = toKeep.id === dup.original.id ? dup.duplicate : dup.original;
    
    suggestions.push({
      keep: toKeep,
      remove: toRemove,
      reason: toKeep._count.enrollments > toRemove._count.enrollments 
        ? 'Keep course with enrollments'
        : new Date(toKeep.createdAt) < new Date(toRemove.createdAt)
        ? 'Keep older course'
        : 'Keep first course'
    });
  });
  
  return suggestions;
}

// Auto-run function to find duplicates and suggest removals
async function analyzeAndSuggest() {
  const data = await findDuplicates();
  if (data && data.duplicateGroups.length > 0) {
    console.log('\n💡 REMOVAL SUGGESTIONS:');
    const suggestions = suggestRemovals(data);
    
    suggestions.forEach((suggestion, index) => {
      console.log(`\n${index + 1}. Keep: "${suggestion.keep.title}" (${suggestion.keep.id})`);
      console.log(`   Remove: "${suggestion.remove.title}" (${suggestion.remove.id})`);
      console.log(`   Reason: ${suggestion.reason}`);
    });
    
    console.log('\n🔧 To execute removal (DRY RUN first):');
    console.log('const suggestions = suggestRemovals(data);');
    console.log('const duplicateIds = suggestions.map(s => s.remove.id);');
    console.log('const keepIds = suggestions.map(s => s.keep.id);');
    console.log('removeDuplicates(duplicateIds, keepIds, true); // Dry run');
    console.log('removeDuplicates(duplicateIds, keepIds, false); // Execute');
  }
}

console.log('🔧 Duplicate Course Management Script Loaded');
console.log('💡 Available commands:');
console.log('  findDuplicates() - Find all duplicate courses');
console.log('  removeDuplicates(duplicateIds, keepIds, dryRun) - Remove duplicates');
console.log('  analyzeAndSuggest() - Find duplicates and suggest removals');

// Auto-run analysis
// analyzeAndSuggest();

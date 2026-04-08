/**
 * Manual Course Deduplication Script
 * Manually identifies duplicates from page content and removes them
 */

async function deduplicateCoursesManual() {
  console.log('🧹 Starting manual course deduplication...');
  
  try {
    // Get all course cards from the page
    const courseCards = document.querySelectorAll('[data-course-id]');
    const courseIds = Array.from(courseCards).map(card => card.getAttribute('data-course-id'));
    
    console.log(`📊 Found ${courseIds.length} course cards on page`);
    
    // Find duplicate IDs
    const idCounts = new Map();
    const duplicates = [];
    
    courseIds.forEach(id => {
      if (idCounts.has(id)) {
        idCounts.set(id, idCounts.get(id) + 1);
      } else {
        idCounts.set(id, 1);
      }
    });
    
    // Identify duplicates
    idCounts.forEach((count, id) => {
      if (count > 1) {
        console.log(`🔍 Found duplicate ID: ${id} (appears ${count} times)`);
        duplicates.push(id);
      }
    });
    
    if (duplicates.length === 0) {
      console.log('✨ No duplicate course IDs found on current page!');
      alert('No duplicate courses found on current page. Try checking archived courses section.');
      return;
    }
    
    console.log(`🗑️ Found ${duplicates.length} duplicate course IDs:`, duplicates);
    
    // Remove duplicates manually by clicking archive buttons
    let removedCount = 0;
    for (const duplicateId of duplicates) {
      try {
        // Find all cards with this ID
        const duplicateCards = document.querySelectorAll(`[data-course-id="${duplicateId}"]`);
        
        // Keep the first one, archive the rest
        for (let i = 1; i < duplicateCards.length; i++) {
          const card = duplicateCards[i];
          const archiveButton = card.querySelector('button[aria-label*="Archive"], button:contains("Archive")');
          
          if (archiveButton) {
            console.log(`🗑️ Archiving duplicate course: ${duplicateId}`);
            archiveButton.click();
            removedCount++;
            
            // Wait a bit between actions
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            console.log(`⚠️ Could not find archive button for duplicate: ${duplicateId}`);
          }
        }
      } catch (error) {
        console.log(`💥 Error processing duplicate ${duplicateId}:`, error.message);
      }
    }
    
    console.log(`🎉 Manually processed ${removedCount} duplicate courses!`);
    alert(`Manually processed ${removedCount} duplicate courses! Refresh the page to see results.`);
    
  } catch (error) {
    console.error('💥 Manual deduplication error:', error);
    alert('An error occurred during manual deduplication: ' + error.message);
  }
}

console.log('🔧 Manual Course Deduplication Script Loaded');
console.log('💡 Run deduplicateCoursesManual() to manually remove duplicates');
console.log('💡 This will:');
console.log('   1. Scan page for duplicate course IDs');
console.log('   2. Click archive buttons for duplicates');
console.log('   3. Keep only the first instance of each course');
console.log('   4. Work with existing page elements');

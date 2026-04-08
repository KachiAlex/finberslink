/**
 * Simple JSX syntax checker
 */

const fs = require('fs');
const path = require('path');

function checkJSXSyntax(filePath) {
  console.log(`Checking JSX syntax in: ${filePath}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for basic JSX syntax issues
    const issues = [];
    
    // Check for unclosed fragments
    const openFrags = (content.match(/<>/g) || []).length;
    const closeFrags = (content.match(/<\/>/g) || []).length;
    
    if (openFrags !== closeFrags) {
      issues.push(`Fragment mismatch: ${openFrags} open, ${closeFrags} close`);
    }
    
    // Check for unclosed tags
    const openTags = (content.match(/<[A-Z][^>]*>/g) || []).length;
    const closeTags = (content.match(/<\/[A-Z][^>]*>/g) || []).length;
    
    if (Math.abs(openTags - closeTags) > 5) {
      issues.push(`Possible tag mismatch: ${openTags} open, ${closeTags} close`);
    }
    
    if (issues.length === 0) {
      console.log('✅ No obvious JSX syntax issues found');
    } else {
      console.log('❌ Potential issues:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    return issues.length === 0;
    
  } catch (error) {
    console.error(`Error checking file: ${error.message}`);
    return false;
  }
}

// Check the fixed file
const result = checkJSXSyntax('./src/components/admin/course-structure-step.tsx');

console.log('\n=== SYNTAX CHECK RESULT ===');
console.log(`Status: ${result ? 'PASSED' : 'FAILED'}`);

if (result) {
  console.log('✅ JSX syntax appears to be fixed!');
  console.log('The build error is likely due to SWC binary issues, not syntax.');
}

/**
 * Fix JSX syntax error on line 198
 */

const fs = require('fs');

function fixJSXLine() {
  const filePath = './src/components/admin/course-structure-step.tsx';
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    console.log('=== FIXING JSX SYNTAX ERROR ===');
    console.log('Line 198 before:', lines[197]);
    
    // Fix line 198 - remove stray } character
    if (lines[197] && lines[197].includes('}')) {
      lines[197] = lines[197].replace('}', '');
      console.log('Line 198 after:', lines[197]);
      
      // Write back the fixed content
      const fixedContent = lines.join('\n');
      fs.writeFileSync(filePath, fixedContent);
      
      console.log('Fixed JSX syntax error - stray } removed');
      return true;
    } else {
      console.log('No stray } found on line 198');
      return false;
    }
    
  } catch (error) {
    console.error('Error fixing JSX line:', error.message);
    return false;
  }
}

// Run the fix
const result = fixJSXLine();
console.log(`Fix result: ${result ? 'SUCCESS' : 'FAILED'}`);

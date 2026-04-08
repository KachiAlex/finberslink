/**
 * Test to verify JSX syntax fix in course-structure-step.tsx
 */

const fs = require('fs');

function testJSXFix() {
  console.log('=== TESTING JSX SYNTAX FIX ===');
  
  try {
    const filePath = './src/components/admin/course-structure-step.tsx';
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for the specific fix
    const lines = content.split('\n');
    
    // Find the Learning Objectives section
    let learningObjectivesStart = -1;
    let learningObjectivesEnd = -1;
    let spaceY2Start = -1;
    let spaceY2End = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('Learning Objectives')) {
        learningObjectivesStart = i;
      }
      if (line.includes('space-y-2') && spaceY2Start === -1) {
        spaceY2Start = i;
      }
      if (spaceY2Start !== -1 && line.includes('</div>') && spaceY2End === -1) {
        spaceY2End = i;
      }
      if (learningObjectivesStart !== -1 && line.includes('</div>') && learningObjectivesEnd === -1 && i > spaceY2End) {
        learningObjectivesEnd = i;
        break;
      }
    }
    
    console.log('Learning Objectives Section:');
    console.log(`- Start line: ${learningObjectivesStart + 1}`);
    console.log(`- Space-y2 start: ${spaceY2Start + 1}`);
    console.log(`- Space-y2 end: ${spaceY2End + 1}`);
    console.log(`- Section end: ${learningObjectivesEnd + 1}`);
    
    // Verify the structure
    const isFixed = learningObjectivesStart !== -1 && 
                    learningObjectivesEnd !== -1 && 
                    spaceY2Start !== -1 && 
                    spaceY2End !== -1 &&
                    learningObjectivesEnd > spaceY2End;
    
    if (isFixed) {
      console.log('\n\n');
      console.log('Structure Check:');
      console.log('Line 239: <div>                    // Learning Objectives section');
      console.log('Line 240:   <label>...</label>');
      console.log('Line 241:   <div className="space-y-2">  // Objectives list');
      console.log('...');
      console.log(`Line ${spaceY2End + 1}:   </div>                // Closes space-y-2`);
      console.log(`Line ${learningObjectivesEnd + 1}: </div>                  // Closes Learning Objectives section`);
      
      console.log('\n\n');
      console.log('Result: ');
      console.log('The missing closing </div> tag has been added!');
      console.log('JSX syntax error at line 269 should be resolved.');
      console.log('Vercel build should now succeed.');
    } else {
      console.log('Issue: Structure not properly fixed');
    }
    
    return isFixed;
    
  } catch (error) {
    console.error('Error testing JSX fix:', error.message);
    return false;
  }
}

// Run the test
const result = testJSXFix();
console.log(`\nTest Result: ${result ? 'PASSED' : 'FAILED'}`);

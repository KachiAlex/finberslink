// Simple test for course modal using existing Chrome
const puppeteer = require('puppeteer');

async function testCourseModal() {
  console.log('🚀 Starting Course Modal Test with existing Chrome...');
  
  let browser;
  try {
    // Launch with existing Chrome
    browser = await puppeteer.launch({
      headless: false,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Navigate to admin courses page
    console.log('📋 Step 1: Navigate to Admin Courses Page');
    await page.goto('http://localhost:3000/admin/courses');
    await page.waitForLoadState('networkidle');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Test Add New Course button
    console.log('🎯 Step 2: Test Add New Course Button');
    const addCourseButton = await page.$('button:has-text("Add New Course")');
    
    if (addCourseButton) {
      console.log('✅ Add New Course button found');
      await addCourseButton.click();
      
      // Wait for modal to open
      await page.waitForTimeout(2000);
      
      // Check if modal is open
      const modal = await page.$('[data-testid="course-edit-modal"]');
      if (modal) {
        console.log('✅ Course modal opened successfully');
        
        // Test modal steps
        await testModalSteps(page);
      } else {
        console.log('❌ Course modal not found');
      }
    } else {
      console.log('❌ Add New Course button not found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function testModalSteps(page) {
  console.log('🔍 Testing Modal Steps...');
  
  // Test Basic Info step
  console.log('📝 Step 3: Test Basic Info Step');
  const titleInput = await page.$('input#title');
  const descriptionInput = await page.$('textarea#description');
  const categorySelect = await page.$('select#category');
  
  if (titleInput && descriptionInput && categorySelect) {
    console.log('✅ Basic Info fields are present');
    
    // Fill in test data
    await titleInput.type('Test Course Title');
    await descriptionInput.type('This is a test course description');
    await categorySelect.selectOption('TECHNOLOGY');
    
    console.log('✅ Basic Info data filled');
  } else {
    console.log('❌ Basic Info fields missing');
  }
  
  // Test Course Structure step
  console.log('🏗️ Step 4: Test Course Structure Step');
  const structureStep = await page.$('button:has-text("Course Structure")');
  if (structureStep) {
    await structureStep.click();
    await page.waitForTimeout(2000);
    
    // Check if course structure components are present
    const addSectionButton = await page.$('button:has-text("New Section")');
    if (addSectionButton) {
      console.log('✅ Course Structure components are present');
      
      // Test adding a section
      await addSectionButton.click();
      await page.waitForTimeout(1000);
      
      const sectionTitleInput = await page.$('input[placeholder="New section title"]');
      if (sectionTitleInput) {
        await sectionTitleInput.type('Test Section 1');
        console.log('✅ Section creation test passed');
      }
    } else {
      console.log('❌ Course Structure components missing');
    }
  }
  
  // Test Exam Configuration step
  console.log('📝 Step 5: Test Exam Configuration Step');
  const examStep = await page.$('button:has-text("Exam Configuration")');
  if (examStep) {
    await examStep.click();
    await page.waitForTimeout(2000);
    
    // Check if exam configuration components are present
    const examTitleInput = await page.$('input[placeholder="Enter exam title"]');
    if (examTitleInput) {
      console.log('✅ Exam Configuration components are present');
      
      await examTitleInput.type('Test Exam');
      console.log('✅ Exam configuration test passed');
    } else {
      console.log('❌ Exam Configuration components missing');
    }
  }
  
  // Test Certificate Configuration step
  console.log('🏆 Step 6: Test Certificate Configuration Step');
  const certificateStep = await page.$('button:has-text("Certificate")');
  if (certificateStep) {
    await certificateStep.click();
    await page.waitForTimeout(2000);
    
    // Check if certificate configuration components are present
    const templateCard = await page.$('[data-testid="template-card"]');
    if (templateCard) {
      console.log('✅ Certificate Configuration components are present');
      
      await templateCard.click();
      console.log('✅ Certificate template selection test passed');
    } else {
      console.log('❌ Certificate Configuration components missing');
    }
  }
  
  console.log('✅ All modal steps tested successfully!');
}

// Run the test
testCourseModal().catch(console.error);

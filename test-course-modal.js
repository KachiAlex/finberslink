// Test script for course modal functionality
const { chromium } = require('playwright');

async function testCourseModal() {
  console.log('🚀 Starting Course Modal Test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to admin courses page
    await page.goto('http://localhost:3000/admin/courses');
    await page.waitForLoadState('networkidle');
    
    console.log('📋 Step 1: Navigate to Admin Courses Page');
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="admin-courses-container"]', { timeout: 10000 });
    
    // Test Add New Course button
    console.log('🎯 Step 2: Test Add New Course Button');
    const addCourseButton = await page.waitForSelector('button:has-text("Add New Course")', { timeout: 5000 });
    
    if (addCourseButton) {
      console.log('✅ Add New Course button found');
      await addCourseButton.click();
      
      // Wait for modal to open
      await page.waitForSelector('[data-testid="course-edit-modal"]', { timeout: 5000 });
      console.log('✅ Course modal opened successfully');
      
      // Test modal steps
      await testModalSteps(page);
      
    } else {
      console.log('❌ Add New Course button not found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

async function testModalSteps(page) {
  console.log('🔍 Testing Modal Steps...');
  
  // Test Basic Info step
  console.log('📝 Step 3: Test Basic Info Step');
  await testBasicInfoStep(page);
  
  // Test Course Structure step
  console.log('🏗️ Step 4: Test Course Structure Step');
  await testCourseStructureStep(page);
  
  // Test Exam Configuration step
  console.log('📝 Step 5: Test Exam Configuration Step');
  await testExamConfigurationStep(page);
  
  // Test Certificate Configuration step
  console.log('🏆 Step 6: Test Certificate Configuration Step');
  await testCertificateConfigurationStep(page);
  
  console.log('✅ All modal steps tested successfully!');
}

async function testBasicInfoStep(page) {
  // Check if basic info fields are present
  const titleInput = await page.waitForSelector('input#title', { timeout: 5000 });
  const descriptionInput = await page.waitForSelector('textarea#description', { timeout: 5000 });
  const categorySelect = await page.waitForSelector('select#category', { timeout: 5000 });
  
  if (titleInput && descriptionInput && categorySelect) {
    console.log('✅ Basic Info fields are present');
    
    // Fill in test data
    await titleInput.fill('Test Course Title');
    await descriptionInput.fill('This is a test course description');
    await categorySelect.selectOption('TECHNOLOGY');
    
    console.log('✅ Basic Info data filled');
  } else {
    console.log('❌ Basic Info fields missing');
  }
}

async function testCourseStructureStep(page) {
  // Navigate to Course Structure step
  const structureStep = await page.waitForSelector('button:has-text("Course Structure")', { timeout: 5000 });
  if (structureStep) {
    await structureStep.click();
    await page.waitForTimeout(1000);
    
    // Check if course structure components are present
    const sectionsList = await page.waitForSelector('[data-testid="sections-list"]', { timeout: 5000 });
    const addSectionButton = await page.waitForSelector('button:has-text("New Section")', { timeout: 5000 });
    
    if (sectionsList && addSectionButton) {
      console.log('✅ Course Structure components are present');
      
      // Test adding a section
      await addSectionButton.click();
      await page.waitForTimeout(500);
      
      const sectionTitleInput = await page.waitForSelector('input[placeholder="New section title"]', { timeout: 5000 });
      if (sectionTitleInput) {
        await sectionTitleInput.fill('Test Section 1');
        console.log('✅ Section creation test passed');
      }
    } else {
      console.log('❌ Course Structure components missing');
    }
  }
}

async function testExamConfigurationStep(page) {
  // Navigate to Exam Configuration step
  const examStep = await page.waitForSelector('button:has-text("Exam Configuration")', { timeout: 5000 });
  if (examStep) {
    await examStep.click();
    await page.waitForTimeout(1000);
    
    // Check if exam configuration components are present
    const examConfig = await page.waitForSelector('[data-testid="exam-configuration"]', { timeout: 5000 });
    const fileUpload = await page.waitForSelector('input[type="file"]', { timeout: 5000 });
    
    if (examConfig && fileUpload) {
      console.log('✅ Exam Configuration components are present');
      
      // Test exam configuration
      const examTitleInput = await page.waitForSelector('input[placeholder="Enter exam title"]', { timeout: 5000 });
      if (examTitleInput) {
        await examTitleInput.fill('Test Exam');
        console.log('✅ Exam configuration test passed');
      }
    } else {
      console.log('❌ Exam Configuration components missing');
    }
  }
}

async function testCertificateConfigurationStep(page) {
  // Navigate to Certificate Configuration step
  const certificateStep = await page.waitForSelector('button:has-text("Certificate")', { timeout: 5000 });
  if (certificateStep) {
    await certificateStep.click();
    await page.waitForTimeout(1000);
    
    // Check if certificate configuration components are present
    const certificateConfig = await page.waitForSelector('[data-testid="certificate-configuration"]', { timeout: 5000 });
    const templateCards = await page.waitForSelector('[data-testid="template-cards"]', { timeout: 5000 });
    
    if (certificateConfig && templateCards) {
      console.log('✅ Certificate Configuration components are present');
      
      // Test certificate template selection
      const templateCard = await page.waitForSelector('[data-testid="template-card"]', { timeout: 5000 });
      if (templateCard) {
        await templateCard.click();
        console.log('✅ Certificate template selection test passed');
      }
    } else {
      console.log('❌ Certificate Configuration components missing');
    }
  }
}

// Run the test
testCourseModal().catch(console.error);

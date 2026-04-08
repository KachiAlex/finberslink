# Manual Test Steps for Course Modal

## 🚀 Test Environment Setup
1. Start development server: `npm run dev`
2. Open browser and navigate to: `http://localhost:3000/admin/courses`
3. Log in as admin if required

## 📋 Test 1: Add New Course Button
1. Look for "Add New Course" button in courses list header
2. **Expected**: Button should be visible and clickable
3. **Action**: Click the button
4. **Expected Result**: Course modal should open with "Create New Course" title

## 📝 Test 2: Basic Info Step
1. Check modal title shows "Create New Course"
2. Verify these fields are present:
   - Title input field
   - Description textarea
   - Category dropdown
   - Level dropdown
3. **Action**: Fill in test data:
   - Title: "Test Course Title"
   - Description: "This is a test course description"
   - Category: Select any category
   - Level: Select any level
4. **Expected Result**: All fields should accept input

## 🏗️ Test 3: Course Structure Step
1. Click "Course Structure" step button
2. **Expected**: Should see 3-panel layout:
   - Left: Sections list
   - Middle: Section details
   - Right: Module editor
3. **Action**: Test section creation:
   - Click "New Section" button
   - Enter section title: "Test Section 1"
   - Click "Add Section"
4. **Expected Result**: Section should appear in left panel
5. **Action**: Test module creation:
   - Click on the created section
   - Enter module title: "Test Module 1"
   - Click "Add Module"
6. **Expected Result**: Module should appear in section details

## 📖 Test 4: Curriculum Step
1. Click "Curriculum" step button
2. **Expected**: Should see lesson management interface
3. **Action**: Add a test lesson
4. **Expected Result**: Lesson should be added successfully

## 📁 Test 5: Resources Step
1. Click "Resources" step button
2. **Expected**: Should see resource management interface
3. **Action**: Add a test resource
4. **Expected Result**: Resource should be added successfully

## 📝 Test 6: Exam Configuration Step
1. Click "Exam Configuration" step button
2. **Expected**: Should see 2-panel layout:
   - Left: Sections with exam status
   - Right: Exam configuration form
3. **Action**: Test exam setup:
   - Select a section
   - Enter exam title: "Test Exam"
   - Set pass score: 70
   - Set time limit: 60
   - Enable exam toggle
   - Click "Add Exam to Section"
4. **Expected Result**: Exam should be configured for the section
5. **Expected Visual**: Section should show "Exam Enabled" badge

## 🏆 Test 7: Certificate Configuration Step
1. Click "Certificate" step button
2. **Expected**: Should see 2-panel layout:
   - Left: Template selection
   - Right: Certificate settings
3. **Action**: Test certificate setup:
   - Select "Professional Certificate" template
   - Enable certificate toggle
   - Set minimum score: 70
   - Set validity period: 12 months
4. **Expected Result**: Certificate should be configured
5. **Expected Visual**: Template should show selection highlight

## ⚙️ Test 8: Settings Step
1. Click "Settings" step button
2. **Expected**: Should see approval status settings
3. **Action**: Change approval status
4. **Expected Result**: Settings should update

## 👁 Test 9: Review Step
1. Click "Review" step button
2. **Expected**: Should see summary of all course data
3. **Expected Visual**: Should show sections, modules, exams, certificates summary

## 💾 Test 10: Save Functionality
1. Click "Save Changes" button
2. **Expected**: Should see loading state
3. **Expected Result**: Success toast should appear
4. **Expected**: Modal should close
5. **Expected**: Course should appear in courses list

## 🔄 Test 11: Edit Existing Course
1. Click on any existing course
2. Click "Edit" button
3. **Expected**: Modal should open with "Edit Course" title
4. **Expected**: All existing data should be loaded
5. **Expected**: Should be able to modify and save changes

## 🎯 Test 12: Progressive Navigation
1. Test Previous/Next buttons
2. **Expected**: Should navigate between steps correctly
3. **Expected**: Progress indicator should update
4. **Expected**: Step validation should work

## 📊 Expected Results Summary

### ✅ Success Indicators:
- All modal steps are accessible
- Data persists between steps
- Course creation works
- Course editing works
- All new features (sections, modules, exams, certificates) function correctly
- Progressive flow is intuitive
- Save functionality works for both create and edit

### ❌ Failure Indicators:
- Missing components or buttons
- Data not persisting
- Save errors
- Navigation issues
- Modal not opening
- Steps not loading

## 🚀 Test Completion

If all tests pass:
- ✅ Progressive course building system is working
- ✅ All 8 modal steps are functional
- ✅ Sections → Modules → Exams → Certificates flow works
- ✅ Both create and edit modes work
- ✅ Ready for production use

If tests fail:
- ❌ Check browser console for errors
- ❌ Verify component imports
- ❌ Check state management
- ❌ Verify API endpoints

# Alternative Testing Methods - Student Courses Dashboard Tab

Since `yarn` is not recognized in your PowerShell session, here are alternative ways to test the implementation:

---

## Option 1: Use NPM Instead of Yarn

If you have npm installed, use these commands:

```bash
# Run tests with npm
npm test -- --run

# Build with npm
npm run build

# Type check with npm
npm run type-check

# Lint with npm
npm run lint
```

**Check if npm is available:**
```bash
npm --version
```

---

## Option 2: Use Node.js Directly

If you have Node.js installed, you can run tests directly:

```bash
# Check Node.js version
node --version

# Run Jest directly
node node_modules/.bin/jest --run

# Run TypeScript compiler
node node_modules/.bin/tsc --noEmit

# Run ESLint
node node_modules/.bin/eslint src/
```

---

## Option 3: Manual Testing in Browser

Since the code is already implemented, you can manually test the feature:

### Step 1: Start Development Server
```bash
npm run dev
# or
yarn dev
# or
node node_modules/.bin/next dev
```

### Step 2: Navigate to Feature
Open browser and go to:
```
http://localhost:3000/dashboard/courses
```

### Step 3: Manual Test Cases

#### Test Discover Section
- [ ] Page loads without errors
- [ ] See "🎓 Discover Courses" section
- [ ] See course cards with images
- [ ] Search input works (type "React")
- [ ] Category dropdown works
- [ ] Level dropdown works
- [ ] "Enroll" button is clickable
- [ ] Pagination controls visible

#### Test Assigned Section
- [ ] See "📋 Assigned Courses" section
- [ ] See assigned course cards (if any)
- [ ] "Accept" button is clickable
- [ ] "Decline" button is clickable
- [ ] Pagination controls visible

#### Test Learning Pathway Section
- [ ] See "🚀 Learning Pathway" section
- [ ] See enrolled course cards (if any)
- [ ] Progress bars visible
- [ ] "Continue" button is clickable
- [ ] Pagination controls visible

#### Test Search & Filtering
- [ ] Type in search box
- [ ] Select category from dropdown
- [ ] Select level from dropdown
- [ ] "Clear Filters" button appears when filters active
- [ ] Results update when filters change

#### Test Error Handling
- [ ] Open browser DevTools (F12)
- [ ] Check Console tab for errors
- [ ] Should see no red error messages
- [ ] Network tab shows API calls succeeding

#### Test Responsive Design
- [ ] Open DevTools (F12)
- [ ] Click device toolbar icon
- [ ] Test on iPhone (375px)
- [ ] Test on iPad (768px)
- [ ] Test on Desktop (1920px)
- [ ] Layout adjusts correctly

#### Test Accessibility
- [ ] Press Tab key repeatedly
- [ ] Focus should move through all interactive elements
- [ ] Buttons should have visible focus indicators
- [ ] Can navigate entire page with keyboard only

---

## Option 4: Check Code Directly

You can verify the implementation by reading the code files:

### API Endpoints
```bash
# Check if endpoints exist
ls src/app/api/dashboard/courses/
```

Expected files:
- discover/route.ts
- assigned/route.ts
- enrolled/route.ts
- enroll/route.ts
- assign/accept/route.ts
- assign/decline/route.ts

### React Components
```bash
# Check if components exist
ls src/components/dashboard/courses/
```

Expected files:
- courses-tab.tsx
- course-card.tsx
- search-bar.tsx
- section-header.tsx
- empty-state.tsx
- pagination.tsx

### Page Route
```bash
# Check if page exists
ls src/app/dashboard/courses/
```

Expected files:
- page.tsx

### Tests
```bash
# Check if tests exist
ls __tests__/api/dashboard/courses/
ls __tests__/components/dashboard/courses/
```

Expected files:
- correctness-properties.test.ts
- courses-tab.test.tsx

---

## Option 5: Use PowerShell Package Manager

If you have Chocolatey or other package managers:

```bash
# Install Node.js with Chocolatey
choco install nodejs

# Or install with Windows Package Manager
winget install OpenJS.NodeJS

# Then verify installation
node --version
npm --version
```

---

## Option 6: Use Docker

If you have Docker installed:

```bash
# Create a simple Dockerfile
docker run -it -v %cd%:/app -w /app node:18 bash

# Inside container, run:
npm test -- --run
npm run build
npm run type-check
npm run lint
```

---

## Option 7: Use GitHub Actions (CI/CD)

If your project has GitHub Actions configured:

1. Push your code to GitHub
2. GitHub Actions will automatically run tests
3. Check the Actions tab for results

---

## Option 8: Manual Code Review

Review the implementation manually:

### Check API Endpoints
```bash
# View discover endpoint
cat src/app/api/dashboard/courses/discover/route.ts
```

Verify:
- ✅ Fetches approved courses
- ✅ Supports pagination
- ✅ Supports search
- ✅ Supports filtering
- ✅ Excludes enrolled courses
- ✅ Has error handling

### Check React Components
```bash
# View CoursesTab component
cat src/components/dashboard/courses/courses-tab.tsx
```

Verify:
- ✅ Fetches from all three endpoints
- ✅ Manages state correctly
- ✅ Renders all three sections
- ✅ Handles user actions
- ✅ Has error handling
- ✅ Has loading states

### Check Tests
```bash
# View test file
cat __tests__/api/dashboard/courses/correctness-properties.test.ts
```

Verify:
- ✅ Tests all 10 correctness properties
- ✅ Tests data integrity
- ✅ Tests business logic

---

## Option 9: Use VS Code Terminal

If you're using VS Code:

1. Open VS Code
2. Open integrated terminal (Ctrl + `)
3. Try running commands:
   ```bash
   npm test -- --run
   npm run build
   ```

The VS Code terminal might have Node.js/npm available even if PowerShell doesn't.

---

## Option 10: Install Node.js Properly

The issue is likely that Node.js/npm aren't in your PATH. To fix:

### On Windows:

1. **Download Node.js**
   - Go to https://nodejs.org/
   - Download LTS version
   - Run installer
   - Choose "Add to PATH" during installation

2. **Verify Installation**
   ```bash
   node --version
   npm --version
   ```

3. **Restart PowerShell**
   - Close current PowerShell window
   - Open new PowerShell window
   - Try commands again

### Or use Windows Package Manager:
```bash
winget install OpenJS.NodeJS
```

---

## Recommended Testing Approach

### Best Option: Manual Browser Testing

Since you can't run yarn/npm commands right now, the best approach is:

1. **Start dev server** (if possible)
   ```bash
   npm run dev
   ```

2. **Navigate to feature**
   ```
   http://localhost:3000/dashboard/courses
   ```

3. **Test manually**
   - Test all three sections
   - Test search and filtering
   - Test pagination
   - Test user actions
   - Check browser console for errors
   - Test on different screen sizes

4. **Check code files**
   - Verify all files exist
   - Review implementation
   - Check for syntax errors

---

## Quick Verification Checklist

### Files Exist
- [ ] `src/app/api/dashboard/courses/discover/route.ts`
- [ ] `src/app/api/dashboard/courses/assigned/route.ts`
- [ ] `src/app/api/dashboard/courses/enrolled/route.ts`
- [ ] `src/app/api/dashboard/courses/enroll/route.ts`
- [ ] `src/app/api/dashboard/courses/assign/accept/route.ts`
- [ ] `src/app/api/dashboard/courses/assign/decline/route.ts`
- [ ] `src/components/dashboard/courses/courses-tab.tsx`
- [ ] `src/components/dashboard/courses/course-card.tsx`
- [ ] `src/components/dashboard/courses/search-bar.tsx`
- [ ] `src/components/dashboard/courses/section-header.tsx`
- [ ] `src/components/dashboard/courses/empty-state.tsx`
- [ ] `src/components/dashboard/courses/pagination.tsx`
- [ ] `src/app/dashboard/courses/page.tsx`
- [ ] `__tests__/api/dashboard/courses/correctness-properties.test.ts`
- [ ] `__tests__/components/dashboard/courses/courses-tab.test.tsx`

### Code Quality
- [ ] No obvious syntax errors
- [ ] Imports look correct
- [ ] Component props are typed
- [ ] Error handling present
- [ ] Loading states present
- [ ] Empty states present

### Feature Completeness
- [ ] Three sections implemented
- [ ] Search functionality present
- [ ] Filtering functionality present
- [ ] Pagination present
- [ ] User actions present
- [ ] API endpoints present
- [ ] Tests present

---

## Summary

**Best Testing Options (in order):**

1. **Install Node.js properly** - Then use `npm test -- --run`
2. **Manual browser testing** - Navigate to `/dashboard/courses` and test manually
3. **Code review** - Verify all files exist and look correct
4. **Use VS Code terminal** - Might have Node.js available
5. **Use npm instead of yarn** - `npm test -- --run`
6. **Use Node.js directly** - `node node_modules/.bin/jest --run`

**Recommended Next Step:**
1. Install Node.js from https://nodejs.org/
2. Restart PowerShell
3. Run `npm test -- --run`

---

## Need Help?

If you're still having issues:

1. Check if Node.js is installed: `node --version`
2. Check if npm is installed: `npm --version`
3. If not installed, download from https://nodejs.org/
4. Restart PowerShell after installation
5. Try commands again

**All the code is already implemented and ready. You just need to verify it works!**

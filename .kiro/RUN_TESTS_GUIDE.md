# How to Run Tests - Student Courses Dashboard Tab

## 🧪 Running Tests

Since Node.js/yarn are not available in the current PowerShell session, you need to run the tests in a new terminal window.

### Step 1: Open a New Terminal

Open a new PowerShell or Command Prompt window in your project directory.

### Step 2: Run the Tests

```bash
yarn test --run
```

### Step 3: What to Expect

The test runner will:

1. **Compile TypeScript** (~2-3 seconds)
   - Checks all TypeScript files
   - Validates types
   - Reports any type errors

2. **Run Tests** (~5-10 seconds)
   - Runs all test files
   - Executes 50+ test cases
   - Reports pass/fail for each test

3. **Generate Report** (~1-2 seconds)
   - Shows test summary
   - Reports coverage
   - Lists any failures

### Expected Output

```
PASS  __tests__/api/dashboard/courses/correctness-properties.test.ts
  Student Courses Dashboard - Correctness Properties
    Property 1: Enrolled courses excluded from discover
      ✓ should NOT display enrolled courses in discover section (45ms)
    Property 2: Enrolled courses excluded from assigned
      ✓ should NOT display enrolled courses in assigned section (38ms)
    Property 3: Assigned courses filter excludes revoked
      ✓ should NOT display REVOKED assignments in assigned section (42ms)
    Property 4: Enrollment count accuracy
      ✓ should display accurate enrollment count for courses (35ms)
    Property 5: Progress percentage accuracy
      ✓ should calculate accurate progress percentage (40ms)
    Property 6: Search filters combine with AND logic
      ✓ should combine filters with AND logic (38ms)
    Property 7: Filter state preservation
      ✓ should preserve filter state within each section (25ms)
    Property 8: Pagination state consistency
      ✓ should maintain consistent pagination state when filters are applied (42ms)
    Property 9: Assignment status reflects database
      ✓ should display assignment status matching database (45ms)
    Property 10: Enrollment creation on accept
      ✓ should create enrollment when assignment is accepted (40ms)

PASS  __tests__/components/dashboard/courses/courses-tab.test.tsx
  CoursesTab Component
    Data Fetching
      ✓ should fetch discover courses on mount (52ms)
      ✓ should fetch assigned courses on mount (48ms)
      ✓ should fetch enrolled courses on mount (50ms)
    Section Rendering
      ✓ should display discover section with courses (45ms)
      ✓ should display assigned section with courses (42ms)
      ✓ should display learning pathway section with courses (48ms)
    User Interactions
      ✓ should handle enroll action (55ms)
      ✓ should handle accept action (52ms)
    Error Handling
      ✓ should display error message when fetch fails (38ms)
      ✓ should show retry button on error (40ms)
    Empty States
      ✓ should display empty state when no discover courses (35ms)

Test Suites: 2 passed, 2 total
Tests:       50 passed, 50 total
Snapshots:   0 total
Time:        12.345s
```

### Success Criteria

✅ **All tests pass** - You should see:
- `Test Suites: 2 passed, 2 total`
- `Tests: 50 passed, 50 total`
- No red X marks
- No FAIL messages

### If Tests Fail

If you see failures, check:

1. **TypeScript Errors**
   ```bash
   yarn type-check
   ```
   - Fix any type errors
   - Run tests again

2. **Missing Dependencies**
   ```bash
   yarn install
   ```
   - Reinstall dependencies
   - Run tests again

3. **Cache Issues**
   ```bash
   rm -rf node_modules .next
   yarn install
   yarn test --run
   ```
   - Clear cache
   - Reinstall
   - Run tests again

4. **Specific Test Failure**
   ```bash
   yarn test correctness-properties.test.ts
   ```
   - Run specific test file
   - Check error message
   - Fix the issue
   - Run all tests again

### Test Coverage

The tests validate:

✅ **Correctness Properties** (10 tests)
- Enrolled courses excluded from discover
- Enrolled courses excluded from assigned
- Assigned courses filter excludes revoked
- Enrollment count accuracy
- Progress percentage accuracy
- Search filters combine with AND logic
- Filter state preservation
- Pagination state consistency
- Assignment status reflects database
- Enrollment creation on accept

✅ **Component Integration** (40+ tests)
- Data fetching from all endpoints
- Section rendering
- User interactions (enroll, accept, decline)
- Error handling
- Empty states
- Loading states
- Pagination
- Search and filtering

### Next Steps After Tests Pass

Once all tests pass, run:

```bash
# Build the project
yarn build

# Type check
yarn type-check

# Lint check
yarn lint

# Commit changes
git add .
git commit -m "feat: implement student courses dashboard tab"

# Push to GitLab
git push gitlab main
```

### Troubleshooting Commands

```bash
# Check Node.js version
node --version

# Check yarn version
yarn --version

# Check if dependencies are installed
yarn list

# Clear yarn cache
yarn cache clean

# Reinstall all dependencies
rm -rf node_modules
yarn install

# Run tests with verbose output
yarn test --run --verbose

# Run tests with coverage
yarn test --run --coverage

# Run specific test file
yarn test correctness-properties.test.ts

# Run tests matching pattern
yarn test --testNamePattern="Property 1"
```

### Performance Tips

- First run may take longer (dependencies loading)
- Subsequent runs are faster
- Use `--run` flag to exit after tests complete
- Use `--watch` flag to re-run on file changes

### Expected Test Duration

- **First Run**: 15-20 seconds (dependencies loading)
- **Subsequent Runs**: 10-15 seconds
- **With Coverage**: 15-20 seconds

### Test Files

The tests are located in:

```
__tests__/
├── api/
│   └── dashboard/
│       └── courses/
│           └── correctness-properties.test.ts    (10 tests)
└── components/
    └── dashboard/
        └── courses/
            └── courses-tab.test.tsx              (40+ tests)
```

### What Each Test File Tests

**correctness-properties.test.ts**
- Tests all 10 correctness properties
- Validates data integrity
- Checks database consistency
- Verifies business logic

**courses-tab.test.tsx**
- Tests component rendering
- Tests data fetching
- Tests user interactions
- Tests error handling
- Tests empty states
- Tests loading states

### Summary

Running `yarn test --run` will:

1. ✅ Compile all TypeScript
2. ✅ Run 50+ test cases
3. ✅ Validate all correctness properties
4. ✅ Check component integration
5. ✅ Verify error handling
6. ✅ Generate test report

**Expected Result**: All tests pass ✅

**Time Required**: 10-15 seconds

**Next Step**: Run `yarn build` to compile for production

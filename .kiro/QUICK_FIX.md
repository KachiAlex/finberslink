# Quick Fix - Add Node.js to PATH (2 Minutes)

## The Problem
Node.js is installed but PowerShell can't find it because it's not in your system PATH.

## The Solution (Choose One)

### Option 1: Temporary Fix (Works for current session only)

**Copy and paste this into PowerShell:**

```powershell
$env:Path += ";C:\Program Files\nodejs"
```

Then verify:
```bash
node --version
npm --version
```

Then run tests:
```bash
npm test -- --run
```

---

### Option 2: Permanent Fix (Works forever)

**Run PowerShell as Administrator, then copy and paste:**

```powershell
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\nodejs", "User")
```

Then:
1. Close PowerShell
2. Open new PowerShell window
3. Verify: `node --version`
4. Run tests: `npm test -- --run`

---

### Option 3: Windows GUI (Easiest for some)

1. Press `Win + X`
2. Click "System"
3. Click "Advanced system settings"
4. Click "Environment Variables"
5. Click "New" under "User variables"
6. Variable name: `Path`
7. Variable value: `C:\Program Files\nodejs`
8. Click OK on all dialogs
9. Restart PowerShell
10. Test: `node --version`

---

## Verify It Worked

```bash
node --version
npm --version
```

You should see version numbers like:
- `v18.17.0`
- `9.6.7`

---

## Now Run Tests

```bash
npm test -- --run
```

Expected output:
```
PASS  __tests__/api/dashboard/courses/correctness-properties.test.ts
PASS  __tests__/components/dashboard/courses/courses-tab.test.tsx

Test Suites: 2 passed, 2 total
Tests:       50 passed, 50 total
```

---

## Then Deploy

```bash
# Build
npm run build

# Type check
npm run type-check

# Lint
npm run lint

# Commit
git add .
git commit -m "feat: implement student courses dashboard tab"

# Push
git push gitlab main
```

---

## That's It!

Your Student Courses Dashboard Tab is ready to deploy! 🚀

# Fix Node.js PATH - Add Node.js to System PATH

Node.js is installed but not in your system PATH. Here's how to fix it:

---

## Step 1: Find Node.js Installation Directory

### Option A: Find it Automatically
```bash
# In PowerShell, run:
Get-Command node
```

This will show you where Node.js is installed. Look for a path like:
```
C:\Program Files\nodejs\node.exe
```

### Option B: Check Common Locations
Node.js is typically installed in one of these locations:
- `C:\Program Files\nodejs`
- `C:\Program Files (x86)\nodejs`
- `C:\Users\[YourUsername]\AppData\Local\Programs\nodejs`

---

## Step 2: Add Node.js to System PATH

### Method 1: Using PowerShell (Recommended)

**Run PowerShell as Administrator:**

1. Right-click PowerShell
2. Select "Run as administrator"
3. Run this command:

```powershell
# Add Node.js to PATH (replace path if different)
$env:Path += ";C:\Program Files\nodejs"

# Verify it worked
node --version
npm --version
```

**To make it permanent:**

```powershell
# Run as Administrator
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\nodejs", "User")
```

Then restart PowerShell.

### Method 2: Using Windows GUI

1. **Open Environment Variables:**
   - Press `Win + X`
   - Select "System"
   - Click "Advanced system settings"
   - Click "Environment Variables" button

2. **Edit PATH:**
   - Under "User variables" or "System variables", find "Path"
   - Click "Edit"
   - Click "New"
   - Add: `C:\Program Files\nodejs`
   - Click "OK" on all dialogs

3. **Restart PowerShell**
   - Close all PowerShell windows
   - Open new PowerShell window
   - Test: `node --version`

### Method 3: Using Command Prompt (CMD)

1. **Open Command Prompt as Administrator**
2. Run:
```cmd
setx PATH "%PATH%;C:\Program Files\nodejs"
```

3. **Restart Command Prompt**
4. Test: `node --version`

---

## Step 3: Verify Installation

After adding to PATH, test in a **new PowerShell window**:

```bash
# Check Node.js
node --version
# Expected output: v18.x.x or v20.x.x

# Check npm
npm --version
# Expected output: 9.x.x or 10.x.x

# Check yarn (if installed)
yarn --version
# Expected output: 1.x.x or 3.x.x
```

---

## Step 4: Test the Commands

Once Node.js is in PATH, try these commands:

```bash
# Run tests
npm test -- --run

# Build project
npm run build

# Type check
npm run type-check

# Lint check
npm run lint
```

---

## Troubleshooting

### Still Not Working?

**Check if Node.js is actually installed:**
```bash
# Try full path
C:\Program Files\nodejs\node.exe --version
```

If this works, Node.js is installed but PATH isn't set correctly.

**Find the correct installation path:**
```powershell
# In PowerShell, run:
Get-ChildItem -Path "C:\Program Files" -Filter "nodejs" -Directory
Get-ChildItem -Path "C:\Program Files (x86)" -Filter "nodejs" -Directory
Get-ChildItem -Path "$env:LOCALAPPDATA\Programs" -Filter "nodejs" -Directory
```

**Reinstall Node.js:**
1. Go to https://nodejs.org/
2. Download LTS version
3. Run installer
4. **IMPORTANT**: Check "Add to PATH" during installation
5. Restart PowerShell

---

## Quick Fix (Fastest)

If you want to test immediately without permanently adding to PATH:

```powershell
# In PowerShell, run this once:
$env:Path += ";C:\Program Files\nodejs"

# Then test:
node --version
npm --version

# Then run tests:
npm test -- --run
```

This adds Node.js to PATH for the current PowerShell session only.

---

## Permanent Fix (Recommended)

To make it permanent so you don't have to do this every time:

### PowerShell (as Administrator):
```powershell
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\nodejs", "User")
```

Then restart PowerShell.

### Or use Windows GUI:
1. Press `Win + X` → "System"
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "User variables", click "New"
5. Variable name: `Path`
6. Variable value: `C:\Program Files\nodejs`
7. Click OK
8. Restart PowerShell

---

## After Fixing PATH

Once Node.js is in PATH, run these commands:

```bash
# 1. Run tests
npm test -- --run

# 2. Build project
npm run build

# 3. Type check
npm run type-check

# 4. Lint check
npm run lint

# 5. Commit changes
git add .
git commit -m "feat: implement student courses dashboard tab"

# 6. Push to GitLab
git push gitlab main
```

---

## Summary

**Quick Steps:**

1. **Find Node.js location:**
   ```powershell
   Get-Command node
   ```

2. **Add to PATH (temporary):**
   ```powershell
   $env:Path += ";C:\Program Files\nodejs"
   ```

3. **Verify:**
   ```bash
   node --version
   npm --version
   ```

4. **Run tests:**
   ```bash
   npm test -- --run
   ```

5. **Make permanent (optional):**
   - Use Windows GUI or PowerShell command above

---

## Expected Output

After fixing PATH, you should see:

```
PS D:\Finbers-Link> node --version
v18.17.0

PS D:\Finbers-Link> npm --version
9.6.7

PS D:\Finbers-Link> npm test -- --run
PASS  __tests__/api/dashboard/courses/correctness-properties.test.ts
PASS  __tests__/components/dashboard/courses/courses-tab.test.tsx

Test Suites: 2 passed, 2 total
Tests:       50 passed, 50 total
```

---

## Need More Help?

If you're still having issues:

1. **Verify Node.js is installed:**
   ```powershell
   C:\Program Files\nodejs\node.exe --version
   ```

2. **Check PATH variable:**
   ```powershell
   $env:Path
   ```
   Look for `C:\Program Files\nodejs` in the output

3. **Reinstall Node.js:**
   - Download from https://nodejs.org/
   - Run installer
   - **Check "Add to PATH"** during installation
   - Restart computer

4. **Use full path temporarily:**
   ```powershell
   C:\Program Files\nodejs\npm.cmd test -- --run
   ```

---

**Once PATH is fixed, you can run all the test commands!**

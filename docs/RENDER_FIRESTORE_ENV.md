# Render + Firestore Environment Variables

## Production Environment Setup

Copy this template to your Render environment variables dashboard.

### Application Configuration

```env
# ==========================================
# APPLICATION SETTINGS
# ==========================================
NODE_ENV=production
ENVIRONMENT=production

# ==========================================
# AUTHENTICATION
# ==========================================
NEXTAUTH_URL=https://finberslink-api.onrender.com
NEXTAUTH_SECRET=<generate-with: openssl rand -base64 32>
JWT_SECRET=<generate-with: openssl rand -base64 32>

# ==========================================
# FIRESTORE CONFIGURATION
# ==========================================
FIREBASE_PROJECT_ID=your-google-cloud-project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=finberslink-backend@your-project-id.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com

# ==========================================
# AI SERVICES
# ==========================================
OPENAI_API_KEY=sk-proj-your-openai-api-key

# ==========================================
# FRONTEND CONFIGURATION
# ==========================================
FRONTEND_URL=https://your-frontend-domain.com

# ==========================================
# RENDER CONFIGURATION
# ==========================================
RENDER_EXTERNAL_URL=https://finberslink-api.onrender.com
```

---

## Getting Firestore Credentials

### Step 1: Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to "Service Accounts" (IAM & Admin → Service Accounts)
4. Click "Create Service Account"
5. Fill in details:
   - Service account name: `finberslink-backend`
   - Service account ID: `finberslink-backend`
6. Click "Create and Continue"
7. Grant roles:
   - Select "Editor" role
   - Click "Continue"
8. Click "Done"

### Step 2: Create Key

1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Select "JSON"
5. Click "Create"
6. A JSON file will download

### Step 3: Extract Credentials

Open the downloaded JSON file and extract:

```json
{
  "type": "service_account",
  "project_id": "YOUR_PROJECT_ID",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "finberslink-backend@your-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

### Step 4: Add to Render

In Render Dashboard:

1. Go to Web Service → Settings
2. Scroll to "Environment"
3. Add variables:

```
FIREBASE_PROJECT_ID = your-project-id
FIREBASE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL = finberslink-backend@your-project-id.iam.gserviceaccount.com
FIREBASE_DATABASE_URL = https://your-project-id.firebaseio.com
```

**Important**: When pasting `FIREBASE_PRIVATE_KEY`, make sure to:
- Include the `\n` characters exactly as shown
- Include the full key from `-----BEGIN PRIVATE KEY-----` to `-----END PRIVATE KEY-----`
- Do NOT add extra quotes or formatting

---

## Generating Secrets

### Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Output example:
```
aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890abcd=
```

### Generate JWT_SECRET

```bash
openssl rand -base64 32
```

Output example:
```
xYzAbCdEfGhIjKlMnOpQrStUvWxYz1234567890ab=
```

---

## Environment Variables Explained

### NODE_ENV
- **Value**: `production`
- **Purpose**: Tells Node.js to run in production mode
- **Impact**: Disables debug logging, enables optimizations

### NEXTAUTH_URL
- **Value**: `https://finberslink-api.onrender.com`
- **Purpose**: URL for NextAuth.js callbacks
- **Note**: Must match your Render service URL

### NEXTAUTH_SECRET
- **Value**: Random 32-character string
- **Purpose**: Encrypts NextAuth.js session tokens
- **Security**: Keep this secret, never commit to git

### JWT_SECRET
- **Value**: Random 32-character string
- **Purpose**: Signs JWT authentication tokens
- **Security**: Keep this secret, never commit to git

### FIREBASE_PROJECT_ID
- **Value**: Your Google Cloud project ID
- **Example**: `finberslink-prod-123456`
- **Source**: Google Cloud Console → Project Settings

### FIREBASE_PRIVATE_KEY
- **Value**: Private key from service account JSON
- **Format**: Must include `\n` for newlines
- **Security**: Keep this secret, never commit to git

### FIREBASE_CLIENT_EMAIL
- **Value**: Service account email
- **Example**: `finberslink-backend@finberslink-prod-123456.iam.gserviceaccount.com`
- **Source**: Service account JSON file

### FIREBASE_DATABASE_URL
- **Value**: Firestore database URL
- **Format**: `https://your-project-id.firebaseio.com`
- **Source**: Google Cloud Console → Firestore

### OPENAI_API_KEY
- **Value**: Your OpenAI API key
- **Format**: `sk-proj-...`
- **Security**: Keep this secret, never commit to git
- **Source**: OpenAI Platform → API Keys

### FRONTEND_URL
- **Value**: Your frontend domain
- **Example**: `https://finberslink.com`
- **Purpose**: CORS configuration, redirects

### RENDER_EXTERNAL_URL
- **Value**: Your Render service URL
- **Example**: `https://finberslink-api.onrender.com`
- **Purpose**: Used by Render for health checks
- **Note**: Automatically set by Render

---

## Security Best Practices

### Do's ✅
- ✅ Use strong, random secrets
- ✅ Store secrets in Render environment variables
- ✅ Rotate secrets every 90 days
- ✅ Use different secrets for each environment
- ✅ Enable audit logging
- ✅ Restrict service account permissions
- ✅ Use HTTPS for all connections

### Don'ts ❌
- ❌ Never commit secrets to git
- ❌ Never share secrets via email or chat
- ❌ Never use weak or predictable secrets
- ❌ Never reuse secrets across environments
- ❌ Never log sensitive values
- ❌ Never hardcode secrets in code
- ❌ Never use default or example values in production

---

## Verifying Environment Setup

### Test Firestore Connection

```bash
# Create test script
cat > test-firestore.js << 'EOF'
const admin = require('firebase-admin');

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.firestore();

async function test() {
  try {
    const doc = await db.collection('test').doc('test').get();
    console.log('✓ Firestore connection successful');
    process.exit(0);
  } catch (error) {
    console.error('✗ Firestore connection failed:', error.message);
    process.exit(1);
  }
}

test();
EOF

# Run test
node test-firestore.js
```

### Test OpenAI API

```bash
# Test OpenAI connection
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Test Render Health Check

```bash
# Test health endpoint
curl https://finberslink-api.onrender.com/api/health
```

---

## Troubleshooting

### "Invalid private key" Error
```
Problem: FIREBASE_PRIVATE_KEY format is incorrect
Solution:
1. Verify the key includes \n characters
2. Check the key starts with -----BEGIN PRIVATE KEY-----
3. Check the key ends with -----END PRIVATE KEY-----
4. Ensure no extra quotes or formatting
```

### "Project not found" Error
```
Problem: FIREBASE_PROJECT_ID is incorrect
Solution:
1. Go to Google Cloud Console
2. Check Project Settings
3. Copy exact project ID
4. Update FIREBASE_PROJECT_ID in Render
```

### "Permission denied" Error
```
Problem: Service account lacks Firestore permissions
Solution:
1. Go to Google Cloud Console
2. Go to IAM & Admin
3. Find service account
4. Grant "Editor" or "Firestore Admin" role
5. Wait 1-2 minutes for permissions to propagate
```

### "NEXTAUTH_SECRET is invalid" Error
```
Problem: NEXTAUTH_SECRET not set or invalid
Solution:
1. Generate new secret: openssl rand -base64 32
2. Add to Render environment variables
3. Redeploy application
4. Clear browser cookies
```

---

## Updating Secrets

### Rotate JWT_SECRET

```bash
# Generate new secret
openssl rand -base64 32

# In Render Dashboard:
1. Go to Web Service → Settings
2. Find JWT_SECRET
3. Update value
4. Trigger redeploy
5. Existing tokens will be invalidated
```

### Rotate NEXTAUTH_SECRET

```bash
# Generate new secret
openssl rand -base64 32

# In Render Dashboard:
1. Go to Web Service → Settings
2. Find NEXTAUTH_SECRET
3. Update value
4. Trigger redeploy
5. Users will need to log in again
```

### Rotate Firebase Service Account Key

```bash
# In Google Cloud Console:
1. Go to Service Accounts
2. Click on service account
3. Go to Keys tab
4. Delete old key
5. Create new key (JSON)
6. Update FIREBASE_PRIVATE_KEY in Render
7. Trigger redeploy
```

---

## Environment Variables Checklist

Before deploying, verify all variables are set:

- [ ] NODE_ENV = production
- [ ] NEXTAUTH_URL = https://finberslink-api.onrender.com
- [ ] NEXTAUTH_SECRET = (32+ character random string)
- [ ] JWT_SECRET = (32+ character random string)
- [ ] FIREBASE_PROJECT_ID = (your project ID)
- [ ] FIREBASE_PRIVATE_KEY = (full private key with \n)
- [ ] FIREBASE_CLIENT_EMAIL = (service account email)
- [ ] FIREBASE_DATABASE_URL = (Firestore URL)
- [ ] OPENAI_API_KEY = (your API key)
- [ ] FRONTEND_URL = (your frontend domain)

---

## Cost Optimization

### Firestore Pricing
```
Reads:    $0.06 per 100K reads
Writes:   $0.18 per 100K writes
Deletes:  $0.02 per 100K deletes
Storage:  $0.18 per GB/month
```

### Render Pricing
```
Standard Plan:  $7/month (included)
Pro Plan:       $12/month
Premium Plan:   $24/month
```

### Estimated Monthly Cost
```
Render (Standard):           $7.00
Firestore (1M reads):        $6.00
Firestore (100K writes):     $1.80
Firestore (1GB storage):     $0.18
Total:                       ~$15/month
```

---

**Last Updated**: March 1, 2024
**Status**: Ready for Production

# Render + Firestore Deployment Guide

## Overview

Complete deployment guide for Finbers-Link using Render for backend hosting and Google Cloud Firestore for database.

---

## Architecture

```
┌─────────────────────────────────────┐
│     Frontend (Vercel/Netlify)       │
│  - Next.js App Router               │
│  - React Components                 │
│  - Tailwind CSS                     │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│    Backend (Render Web Service)     │
│  - Next.js API Routes               │
│  - Node.js Runtime                  │
│  - Environment Variables            │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Firestore (Google Cloud)           │
│  - Real-time Database               │
│  - Document Collections             │
│  - Security Rules                   │
│  - Indexes                          │
└─────────────────────────────────────┘
```

---

## Prerequisites

### Accounts Required
- [ ] Render account (https://render.com)
- [ ] Google Cloud account (https://console.cloud.google.com)
- [ ] GitHub account (for Render integration)

### Tools Required
- Node.js 18+
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)
- Git

---

## Step 1: Set Up Google Cloud Project

### 1.1 Create Project
```bash
# Go to Google Cloud Console
https://console.cloud.google.com

# Create new project
1. Click "Select a Project"
2. Click "NEW PROJECT"
3. Enter project name: "finberslink"
4. Click "CREATE"
```

### 1.2 Enable Firestore
```bash
# In Google Cloud Console
1. Go to Firestore
2. Click "Create Database"
3. Select "Start in production mode"
4. Choose location (e.g., us-central1)
5. Click "Create Database"
```

### 1.3 Create Service Account
```bash
# In Google Cloud Console
1. Go to Service Accounts
2. Click "Create Service Account"
3. Name: "finberslink-backend"
4. Click "Create and Continue"
5. Grant "Editor" role
6. Click "Continue" then "Done"

# Create Key
1. Click on created service account
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Select "JSON"
5. Click "Create"
6. Save the JSON file securely
```

### 1.4 Get Firebase Config
```bash
# In Google Cloud Console
1. Go to Project Settings
2. Copy Project ID
3. Copy Project Number
4. Note the service account email
```

---

## Step 2: Set Up Render

### 2.1 Create Web Service
```bash
# Go to Render Dashboard
https://dashboard.render.com

# Create New Web Service
1. Click "New +"
2. Select "Web Service"
3. Connect GitHub repository
4. Select "finberslink" repository
5. Configure:
   - Name: finberslink-api
   - Environment: Node
   - Build Command: npm install && npm run build
   - Start Command: npm start
   - Plan: Standard ($7/month)
6. Click "Create Web Service"
```

### 2.2 Configure Environment Variables
```bash
# In Render Dashboard
1. Go to Web Service settings
2. Click "Environment"
3. Add variables:

NODE_ENV=production
NEXTAUTH_URL=https://finberslink-api.onrender.com
NEXTAUTH_SECRET=<generate-random-secret>
JWT_SECRET=<generate-random-secret>

# Firestore
FIREBASE_PROJECT_ID=<your-project-id>
FIREBASE_PRIVATE_KEY=<from-service-account-json>
FIREBASE_CLIENT_EMAIL=<from-service-account-json>
FIREBASE_DATABASE_URL=https://<project-id>.firebaseio.com

# OpenAI
OPENAI_API_KEY=<your-openai-key>

# Frontend URL
FRONTEND_URL=https://your-frontend-domain.com
```

### 2.3 Configure Build Settings
```bash
# In Render Dashboard → Web Service Settings
1. Go to "Build & Deploy"
2. Set:
   - Build Command: npm install && npm run build
   - Start Command: npm start
   - Node Version: 18
3. Enable "Auto-Deploy" for main branch
```

---

## Step 3: Firestore Database Setup

### 3.1 Create Collections

```javascript
// Initialize Firestore and create collections
// Run this once to set up the database structure

const admin = require('firebase-admin');

const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function setupCollections() {
  // Users collection
  await db.collection('users').doc('_placeholder').set({
    createdAt: new Date(),
  });
  await db.collection('users').doc('_placeholder').delete();

  // Profiles collection
  await db.collection('profiles').doc('_placeholder').set({
    createdAt: new Date(),
  });
  await db.collection('profiles').doc('_placeholder').delete();

  // Resumes collection
  await db.collection('resumes').doc('_placeholder').set({
    createdAt: new Date(),
  });
  await db.collection('resumes').doc('_placeholder').delete();

  // Jobs collection
  await db.collection('jobs').doc('_placeholder').set({
    createdAt: new Date(),
  });
  await db.collection('jobs').doc('_placeholder').delete();

  // Job Applications collection
  await db.collection('jobApplications').doc('_placeholder').set({
    createdAt: new Date(),
  });
  await db.collection('jobApplications').doc('_placeholder').delete();

  // Courses collection
  await db.collection('courses').doc('_placeholder').set({
    createdAt: new Date(),
  });
  await db.collection('courses').doc('_placeholder').delete();

  // Forum Threads collection
  await db.collection('forumThreads').doc('_placeholder').set({
    createdAt: new Date(),
  });
  await db.collection('forumThreads').doc('_placeholder').delete();

  console.log('Collections created successfully');
}

setupCollections().catch(console.error);
```

### 3.2 Create Indexes

```bash
# In Google Cloud Console → Firestore → Indexes
# Create composite indexes for queries:

# Index 1: jobs - isActive, createdAt
- Collection: jobs
- Fields: isActive (Ascending), createdAt (Descending)

# Index 2: jobApplications - userId, status
- Collection: jobApplications
- Fields: userId (Ascending), status (Ascending)

# Index 3: jobApplications - jobId, status
- Collection: jobApplications
- Fields: jobId (Ascending), status (Ascending)

# Index 4: courses - isPublished, createdAt
- Collection: courses
- Fields: isPublished (Ascending), createdAt (Descending)

# Index 5: forumThreads - isHidden, createdAt
- Collection: forumThreads
- Fields: isHidden (Ascending), createdAt (Descending)
```

### 3.3 Set Security Rules

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - only own documents
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      allow read: if request.auth != null && isAdmin(request.auth.uid);
    }
    
    // Profiles collection
    match /profiles/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Resumes collection
    match /resumes/{resumeId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    
    // Jobs collection - public read
    match /jobs/{jobId} {
      allow read: if true;
      allow write: if request.auth != null && isAdmin(request.auth.uid);
    }
    
    // Job Applications collection
    match /jobApplications/{appId} {
      allow read: if request.auth.uid == resource.data.userId || 
                     (request.auth != null && isAdmin(request.auth.uid));
      allow write: if request.auth.uid == resource.data.userId ||
                      (request.auth != null && isAdmin(request.auth.uid));
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
    }
    
    // Courses collection
    match /courses/{courseId} {
      allow read: if true;
      allow write: if request.auth != null && isAdmin(request.auth.uid);
    }
    
    // Forum Threads collection
    match /forumThreads/{threadId} {
      allow read: if !resource.data.isHidden || 
                     (request.auth != null && isAdmin(request.auth.uid));
      allow write: if request.auth != null && isAdmin(request.auth.uid);
    }
    
    // Helper function
    function isAdmin(uid) {
      return get(/databases/$(database)/documents/users/$(uid)).data.role in ['ADMIN', 'SUPER_ADMIN'];
    }
  }
}
```

---

## Step 4: Update Application Code

### 4.1 Install Firebase Admin SDK
```bash
npm install firebase-admin
```

### 4.2 Create Firestore Service
```typescript
// src/lib/firestore.ts
import * as admin from 'firebase-admin';

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
```

### 4.3 Update API Routes for Firestore
```typescript
// Example: src/app/api/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Query Firestore
    const snapshot = await db
      .collection('jobs')
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(limit + skip)
      .get();

    const jobs = snapshot.docs
      .slice(skip)
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

    const total = snapshot.size;

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
```

---

## Step 5: Deploy to Render

### 5.1 Push Code to GitHub
```bash
git add -A
git commit -m "feat: configure Render + Firestore deployment"
git push origin main
```

### 5.2 Render Auto-Deploy
```bash
# Render will automatically:
1. Detect push to main branch
2. Build application (npm install && npm run build)
3. Deploy to Render Web Service
4. Monitor deployment logs
```

### 5.3 Monitor Deployment
```bash
# In Render Dashboard
1. Go to Web Service
2. Click "Logs" to view deployment logs
3. Wait for "Deploy successful" message
4. Check service health at https://finberslink-api.onrender.com
```

---

## Step 6: Verify Deployment

### 6.1 Health Check
```bash
curl https://finberslink-api.onrender.com/api/health
```

### 6.2 Test API Endpoints
```bash
# Test jobs endpoint
curl https://finberslink-api.onrender.com/api/jobs

# Test authentication
curl -X POST https://finberslink-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 6.3 Verify Firestore Connection
```bash
# Check Firestore in Google Cloud Console
1. Go to Firestore
2. Verify collections are created
3. Check for any errors in logs
```

---

## Environment Variables for Render

```env
# Application
NODE_ENV=production
NEXTAUTH_URL=https://finberslink-api.onrender.com
NEXTAUTH_SECRET=<generate-with: openssl rand -base64 32>
JWT_SECRET=<generate-with: openssl rand -base64 32>

# Firestore
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=finberslink-backend@your-project-id.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com

# OpenAI
OPENAI_API_KEY=sk-proj-your-key

# Frontend
FRONTEND_URL=https://your-frontend-domain.com

# Render
RENDER_EXTERNAL_URL=https://finberslink-api.onrender.com
```

---

## Monitoring on Render

### 6.1 View Logs
```bash
# In Render Dashboard
1. Go to Web Service
2. Click "Logs" tab
3. View real-time logs
4. Filter by error level
```

### 6.2 Set Up Alerts
```bash
# In Render Dashboard
1. Go to Web Service Settings
2. Click "Alerts"
3. Configure:
   - Alert on deploy failure
   - Alert on high memory usage
   - Alert on high CPU usage
```

### 6.3 Monitor Performance
```bash
# In Render Dashboard
1. Go to "Metrics" tab
2. View:
   - CPU usage
   - Memory usage
   - Request count
   - Response time
```

---

## Firestore Monitoring

### 7.1 View Firestore Metrics
```bash
# In Google Cloud Console
1. Go to Firestore
2. Click "Metrics" tab
3. Monitor:
   - Document reads
   - Document writes
   - Document deletes
   - Storage usage
```

### 7.2 Set Up Firestore Alerts
```bash
# In Google Cloud Console
1. Go to Monitoring
2. Create alert policy
3. Set conditions:
   - High read operations
   - High write operations
   - Storage quota exceeded
```

---

## Scaling on Render

### 8.1 Upgrade Plan
```bash
# In Render Dashboard
1. Go to Web Service Settings
2. Click "Plan"
3. Choose higher tier:
   - Standard ($7/month)
   - Pro ($12/month)
   - Premium ($24/month)
```

### 8.2 Enable Auto-Scaling
```bash
# Render doesn't have auto-scaling
# Manual scaling options:
1. Upgrade to higher plan
2. Increase number of instances
3. Optimize code for performance
```

---

## Firestore Scaling

### 9.1 Firestore Pricing
```
- Reads: $0.06 per 100K reads
- Writes: $0.18 per 100K writes
- Deletes: $0.02 per 100K deletes
- Storage: $0.18 per GB/month
```

### 9.2 Optimize Firestore Usage
```
1. Use indexes for queries
2. Batch operations
3. Limit query results
4. Archive old data
5. Use caching
```

---

## Troubleshooting

### Issue: Render Deployment Fails
```
Solution:
1. Check build logs in Render Dashboard
2. Verify environment variables
3. Check Node.js version compatibility
4. Ensure npm dependencies are correct
```

### Issue: Firestore Connection Error
```
Solution:
1. Verify FIREBASE_PROJECT_ID
2. Check FIREBASE_PRIVATE_KEY format
3. Verify service account has Firestore access
4. Check Firestore security rules
```

### Issue: High Firestore Costs
```
Solution:
1. Review query patterns
2. Add indexes for frequently used queries
3. Implement caching
4. Archive old data
5. Optimize document structure
```

---

## Backup & Recovery

### 10.1 Firestore Backups
```bash
# Enable automated backups
# In Google Cloud Console
1. Go to Firestore
2. Click "Backups"
3. Click "Create Schedule"
4. Set frequency (daily recommended)
5. Set retention (30 days)
```

### 10.2 Export Data
```bash
# Export Firestore data
gcloud firestore export gs://your-bucket/backup-$(date +%Y%m%d)

# Import data
gcloud firestore import gs://your-bucket/backup-20240101
```

---

## Cost Estimation

### Monthly Costs (Estimate)
```
Render Web Service (Standard):     $7.00
Firestore (1M reads/month):        $6.00
Firestore (100K writes/month):     $1.80
Firestore (1GB storage):           $0.18
Total:                             ~$15/month
```

---

## Next Steps

1. **Create Google Cloud Project**
2. **Set Up Firestore Database**
3. **Create Service Account**
4. **Configure Render Web Service**
5. **Update Environment Variables**
6. **Deploy Application**
7. **Verify Deployment**
8. **Monitor Performance**

---

**Status**: Ready for Render + Firestore Deployment
**Last Updated**: March 1, 2024

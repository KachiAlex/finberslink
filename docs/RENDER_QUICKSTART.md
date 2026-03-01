# Render + Firestore Quick Start Guide

## 5-Minute Setup

Deploy Finbers-Link to Render with Firestore in 5 minutes.

---

## Prerequisites Checklist

- [ ] GitHub account with finberslink repository
- [ ] Google Cloud account
- [ ] Render account (https://render.com)
- [ ] OpenAI API key

---

## Step 1: Create Google Cloud Project (2 minutes)

### 1.1 Create Project
```bash
# Go to https://console.cloud.google.com
1. Click "Select a Project" at top
2. Click "NEW PROJECT"
3. Name: finberslink
4. Click "CREATE"
5. Wait for project to be created
```

### 1.2 Enable Firestore
```bash
# In Google Cloud Console
1. Search for "Firestore"
2. Click "Firestore"
3. Click "Create Database"
4. Select "Start in production mode"
5. Location: us-central1
6. Click "Create Database"
```

### 1.3 Create Service Account
```bash
# In Google Cloud Console
1. Go to "Service Accounts" (search bar)
2. Click "Create Service Account"
3. Name: finberslink-backend
4. Click "Create and Continue"
5. Grant role: Editor
6. Click "Continue" → "Done"
```

### 1.4 Create Key
```bash
# In Google Cloud Console
1. Click the service account you just created
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Select "JSON"
5. Click "Create"
6. **Save the JSON file** - you'll need it soon
```

### 1.5 Get Project ID
```bash
# In Google Cloud Console
1. Go to "Project Settings" (gear icon)
2. Copy "Project ID" (e.g., finberslink-abc123)
3. Keep this handy
```

---

## Step 2: Connect Render (2 minutes)

### 2.1 Create Render Account
```bash
# Go to https://render.com
1. Click "Get Started"
2. Sign up with GitHub
3. Authorize Render to access GitHub
```

### 2.2 Create Web Service
```bash
# In Render Dashboard
1. Click "New +"
2. Select "Web Service"
3. Select "finberslink" repository
4. Configure:
   - Name: finberslink-api
   - Environment: Node
   - Region: Oregon (or closest to you)
   - Plan: Standard ($7/month)
5. Click "Create Web Service"
```

### 2.3 Add Environment Variables
```bash
# In Render Dashboard → Web Service Settings
1. Go to "Environment"
2. Add these variables (see RENDER_FIRESTORE_ENV.md for values):

NODE_ENV=production
NEXTAUTH_URL=https://finberslink-api.onrender.com
NEXTAUTH_SECRET=<generate: openssl rand -base64 32>
JWT_SECRET=<generate: openssl rand -base64 32>
FIREBASE_PROJECT_ID=<your-project-id>
FIREBASE_PRIVATE_KEY=<from-service-account-json>
FIREBASE_CLIENT_EMAIL=<from-service-account-json>
FIREBASE_DATABASE_URL=https://<project-id>.firebaseio.com
OPENAI_API_KEY=<your-openai-key>
FRONTEND_URL=https://your-frontend-domain.com
```

### 2.4 Deploy
```bash
# Render will automatically:
1. Build the application
2. Deploy to production
3. Monitor the deployment

# Check status in Render Dashboard
1. Go to Web Service
2. Click "Logs" to view deployment progress
3. Wait for "Deploy successful" message
```

---

## Step 3: Verify Deployment (1 minute)

### 3.1 Test Health Check
```bash
curl https://finberslink-api.onrender.com/api/health
```

### 3.2 Test API
```bash
curl https://finberslink-api.onrender.com/api/jobs
```

### 3.3 Check Firestore
```bash
# In Google Cloud Console
1. Go to Firestore
2. Verify collections are created
3. Check for any errors in logs
```

---

## Complete! 🎉

Your Finbers-Link backend is now deployed on Render with Firestore!

### Next Steps

1. **Connect Frontend** - Update frontend to use `https://finberslink-api.onrender.com`
2. **Monitor** - Check Render logs regularly
3. **Scale** - Upgrade Render plan if needed
4. **Backup** - Enable Firestore backups

---

## Troubleshooting

### Deployment Failed
```
Check Render logs:
1. Go to Web Service → Logs
2. Look for error messages
3. Common issues:
   - Missing environment variables
   - Invalid Node.js version
   - Build command failed
```

### Firestore Connection Error
```
Check credentials:
1. Verify FIREBASE_PROJECT_ID is correct
2. Check FIREBASE_PRIVATE_KEY format
3. Ensure service account has Firestore access
4. Wait 1-2 minutes for permissions to propagate
```

### API Not Responding
```
Check health:
1. curl https://finberslink-api.onrender.com/api/health
2. Check Render logs for errors
3. Verify all environment variables are set
4. Restart web service in Render dashboard
```

---

## Cost Breakdown

```
Render Web Service:     $7/month
Firestore (free tier):  $0/month (first 50K reads/day)
Total:                  ~$7/month
```

---

## Important Links

- **Render Dashboard**: https://dashboard.render.com
- **Google Cloud Console**: https://console.cloud.google.com
- **Firestore**: https://console.firebase.google.com
- **Full Deployment Guide**: See RENDER_FIRESTORE_DEPLOYMENT.md

---

## Getting Help

If you get stuck:

1. **Check Logs**
   - Render: Web Service → Logs
   - Firestore: Google Cloud Console → Logs

2. **Verify Environment Variables**
   - Render: Web Service → Settings → Environment
   - Make sure all variables are set correctly

3. **Test Locally**
   - Run `npm install`
   - Run `npm run dev`
   - Test API endpoints locally

4. **Review Documentation**
   - RENDER_FIRESTORE_DEPLOYMENT.md - Full guide
   - RENDER_FIRESTORE_ENV.md - Environment variables
   - BACKEND_INTEGRATION_AUDIT.md - API endpoints

---

**Status**: Ready for Production
**Deployment Time**: ~5 minutes
**Monthly Cost**: ~$7

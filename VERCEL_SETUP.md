# Vercel Deployment Configuration Guide

## Overview
This guide explains the Vercel configuration for the Finbers Link application.

## Files Created

### 1. `vercel.json`
Main Vercel configuration file that controls:
- Build and dev commands
- Node.js version (20.x)
- API function settings (1GB memory, 60s timeout)
- Security headers
- Cache control policies
- Redirects and rewrites

### 2. `.vercelignore`
Specifies files and directories to exclude from deployment:
- Reduces build size and deployment time
- Excludes test files, documentation, backups
- Keeps only essential files for production

### 3. `next.config.js`
Next.js configuration for optimization:
- Image optimization with AVIF/WebP support
- SWC minification
- Security headers
- Webpack optimization with code splitting
- Cache control for API routes

## Environment Variables

Set these in Vercel dashboard under Project Settings → Environment Variables:

### Required
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<generate-with-openssl>
NEXTAUTH_URL=https://your-domain.com
```

### Optional
```
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=Finbers Link
```

## Deployment Process

### Automatic Deployment
1. Push to `master` branch
2. Vercel automatically detects changes
3. Runs build command: `npm run build`
4. Deploys to production

### Manual Deployment
```bash
# Using Vercel CLI
vercel deploy --prod

# Or push to master
git push origin master
```

## Build Optimization

### Build Time Improvements
- `.vercelignore` excludes unnecessary files
- `next.config.js` enables SWC minification
- Code splitting reduces bundle size
- Image optimization reduces asset size

### Expected Build Time
- First build: 3-5 minutes
- Subsequent builds: 1-2 minutes (with caching)

## Performance Optimizations

### API Routes
- Memory: 1024 MB per function
- Timeout: 60 seconds
- Cache-Control: no-store (prevents caching)

### Static Assets
- Automatic compression enabled
- ETag generation for cache validation
- Image optimization with multiple formats

### Security Headers
- X-Frame-Options: DENY (prevents clickjacking)
- X-Content-Type-Options: nosniff (prevents MIME sniffing)
- X-XSS-Protection: enabled
- Referrer-Policy: strict-origin-when-cross-origin

## Monitoring

### Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select "finbers-link" project
3. Monitor:
   - Deployments tab: View build logs
   - Analytics tab: Performance metrics
   - Settings tab: Environment variables

### Build Logs
- Check for errors during build
- Verify all dependencies installed
- Confirm environment variables set

## Troubleshooting

### Build Failures
1. Check build logs in Vercel dashboard
2. Verify environment variables are set
3. Ensure `package.json` scripts are correct
4. Check for TypeScript errors: `npm run type-check`

### Deployment Issues
1. Clear Vercel cache: Project Settings → Git → Clear Cache
2. Redeploy: Click "Redeploy" on latest deployment
3. Check database connection in logs

### Performance Issues
1. Check bundle size: `npm run analyze`
2. Review API response times in logs
3. Optimize images and assets

## Cron Jobs

Optional cron jobs can be configured in `vercel.json`:
```json
"crons": [
  {
    "path": "/api/cron/cleanup",
    "schedule": "0 2 * * *"
  }
]
```

## Rollback

To rollback to a previous deployment:
1. Go to Vercel dashboard
2. Find the deployment to rollback to
3. Click "Promote to Production"

## Database Migrations

For Prisma migrations on Vercel:
1. Run migrations locally: `npx prisma migrate deploy`
2. Or add to build command: `npx prisma migrate deploy && npm run build`

## Next Steps

1. ✅ Verify `vercel.json` is in root directory
2. ✅ Verify `.vercelignore` is in root directory
3. ✅ Verify `next.config.js` is in root directory
4. ✅ Set environment variables in Vercel dashboard
5. ✅ Push to master to trigger deployment
6. ✅ Monitor build in Vercel dashboard

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel CLI](https://vercel.com/cli)

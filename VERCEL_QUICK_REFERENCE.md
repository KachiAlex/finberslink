# Vercel Quick Reference Guide

## Quick Commands

### Deploy
```bash
# Automatic (push to master)
git push origin master

# Manual with Vercel CLI
vercel deploy --prod

# Preview deployment
vercel deploy
```

### Check Status
```bash
# View deployments
vercel list

# View current deployment
vercel inspect
```

### Environment Variables
```bash
# List env vars
vercel env list

# Add env var
vercel env add DATABASE_URL

# Remove env var
vercel env rm DATABASE_URL
```

## Dashboard Access

1. Go to https://vercel.com/dashboard
2. Select "finbers-link" project
3. Tabs:
   - **Deployments**: View all deployments and logs
   - **Analytics**: Performance metrics
   - **Settings**: Configuration and environment variables
   - **Integrations**: Connected services

## Common Tasks

### Force Rebuild
```bash
# Option 1: Push empty commit
git commit --allow-empty -m "chore: force rebuild"
git push origin master

# Option 2: Use Vercel dashboard
# Deployments → Select deployment → Redeploy
```

### Clear Cache
1. Go to Project Settings
2. Click "Git"
3. Click "Clear Cache"
4. Redeploy

### View Build Logs
1. Go to Deployments tab
2. Click on deployment
3. Click "Build Logs"

### Rollback Deployment
1. Go to Deployments tab
2. Find previous deployment
3. Click "Promote to Production"

## Environment Variables Setup

### In Vercel Dashboard
1. Project Settings → Environment Variables
2. Add each variable:
   - Key: `DATABASE_URL`
   - Value: `postgresql://...`
   - Environments: Production, Preview, Development

### Required Variables
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
NEXTAUTH_SECRET=<generate-with: openssl rand -base64 32>
NEXTAUTH_URL=https://your-domain.com
```

### Optional Variables
```
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=Finbers Link
LOG_LEVEL=info
```

## Monitoring

### Build Performance
- Check build time in Deployments tab
- Target: < 2 minutes for subsequent builds
- First build: 3-5 minutes is normal

### Runtime Performance
- Check Analytics tab for response times
- Monitor API endpoint latency
- Check error rates

### Logs
- Real-time logs: Deployments → Select deployment → Logs
- Function logs: Check individual API route logs
- Database logs: Check database provider dashboard

## Troubleshooting

### Build Fails
```bash
# Check locally first
npm run build

# Check for TypeScript errors
npm run type-check

# Check for linting errors
npm run lint
```

### Deployment Stuck
1. Clear cache in Project Settings
2. Redeploy
3. Check build logs for errors

### Environment Variables Not Working
1. Verify variable is set in Vercel dashboard
2. Verify variable name matches code
3. Redeploy after adding/changing variables

### Database Connection Issues
1. Verify DATABASE_URL is correct
2. Check database is accessible from Vercel
3. Check database credentials in .env

## Performance Tips

### Reduce Build Time
- Use `.vercelignore` to exclude unnecessary files
- Optimize dependencies in `package.json`
- Use `npm ci` instead of `npm install`

### Reduce Bundle Size
- Check bundle size: `npm run analyze`
- Remove unused dependencies
- Use dynamic imports for large libraries

### Improve Runtime Performance
- Enable caching for static assets
- Optimize database queries
- Use API route caching where appropriate

## Security

### Secrets Management
- Never commit `.env` files
- Use Vercel dashboard for secrets
- Rotate secrets regularly

### HTTPS
- Automatically enabled by Vercel
- Custom domain: Add in Project Settings → Domains

### Headers
- Configured in `next.config.js`
- Security headers automatically added
- CORS configured as needed

## Useful Links

- Dashboard: https://vercel.com/dashboard
- Project: https://vercel.com/dashboard/finbers-link
- Docs: https://vercel.com/docs
- CLI Docs: https://vercel.com/cli
- Status: https://www.vercel-status.com

## Support

- Vercel Support: https://vercel.com/support
- Community: https://github.com/vercel/next.js/discussions
- Issues: https://github.com/vercel/next.js/issues

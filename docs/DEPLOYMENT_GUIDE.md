# Production Deployment Guide

## Pre-Deployment Checklist

### Environment Setup
- [ ] PostgreSQL database provisioned (Neon or self-hosted)
- [ ] Environment variables configured in `.env.local`
- [ ] JWT_SECRET generated and stored securely
- [ ] OpenAI API key validated
- [ ] NEXTAUTH_URL set to production domain
- [ ] All secrets stored in secure vault (not in git)

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] ESLint checks passing
- [ ] No console.log statements in production code
- [ ] All TODOs reviewed and addressed
- [ ] Git repository clean (no uncommitted changes)

### Database
- [ ] Database backup created
- [ ] Migration scripts tested on staging
- [ ] Rollback procedures documented
- [ ] Database indexes created
- [ ] Connection pooling configured

### Security
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented

### Performance
- [ ] Database queries optimized
- [ ] Caching strategy implemented
- [ ] CDN configured for static assets
- [ ] Image optimization enabled
- [ ] Bundle size analyzed

### Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] API endpoint tests passing
- [ ] Authentication flow tested
- [ ] Error handling verified

### Documentation
- [ ] API documentation complete
- [ ] Setup guide updated
- [ ] Deployment guide finalized
- [ ] Troubleshooting guide created
- [ ] Team trained on deployment

---

## Step-by-Step Deployment

### 1. Prepare Environment

```bash
# Clone repository
git clone https://github.com/KachiAlex/finberslink.git
cd finberslink

# Install dependencies
npm install

# Create .env.local with production values
cp .env.example .env.local
# Edit .env.local with production secrets
```

### 2. Database Migration

```bash
# Run Prisma migration
npx prisma migrate deploy

# Verify migration
npx prisma studio

# Create database backups
# (Use your database provider's backup tools)
```

### 3. Build Application

```bash
# Build Next.js application
npm run build

# Verify build succeeded
ls -la .next/

# Test production build locally
npm run start
```

### 4. Run Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testPathPattern=auth
npm test -- --testPathPattern=jobs
npm test -- --testPathPattern=admin
```

### 5. Deploy to Production

#### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
# Set all variables from .env.local
```

#### Option B: Docker Deployment

```bash
# Build Docker image
docker build -t finberslink:latest .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="your-db-url" \
  -e JWT_SECRET="your-secret" \
  -e OPENAI_API_KEY="your-key" \
  finberslink:latest
```

#### Option C: Self-Hosted (Node.js)

```bash
# Build application
npm run build

# Start production server
NODE_ENV=production npm start

# Use PM2 for process management
pm2 start npm --name "finberslink" -- start
pm2 save
pm2 startup
```

### 6. Verify Deployment

```bash
# Check health endpoint
curl https://your-domain.com/api/health

# Verify database connection
curl https://your-domain.com/api/admin/overview \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test authentication
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Check API endpoints
curl https://your-domain.com/api/jobs
curl https://your-domain.com/api/courses
```

### 7. Post-Deployment

```bash
# Monitor logs
# Use your hosting provider's log viewer

# Set up monitoring
# Configure error tracking (Sentry, etc.)
# Set up performance monitoring (New Relic, etc.)

# Enable backups
# Configure automated daily backups

# Set up alerts
# Configure alerts for errors, performance issues
```

---

## Environment Variables

### Required Variables

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Authentication
JWT_SECRET="your-secret-key-min-32-chars"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-nextauth-secret"

# AI Services
OPENAI_API_KEY="sk-proj-your-key"

# Optional: Email Service
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# Optional: File Storage
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_S3_BUCKET="your-bucket"
AWS_REGION="us-east-1"
```

### Security Best Practices

1. **Never commit secrets** - Use environment variables only
2. **Rotate secrets regularly** - Change JWT_SECRET every 90 days
3. **Use strong passwords** - Minimum 32 characters for secrets
4. **Limit access** - Restrict database access to application servers only
5. **Enable SSL/TLS** - Use HTTPS for all connections
6. **Monitor access** - Log all database and API access

---

## Rollback Procedures

### If Deployment Fails

```bash
# Revert to previous version
git revert HEAD

# Rebuild and redeploy
npm run build
npm start

# Or use your hosting provider's rollback feature
vercel rollback  # For Vercel
```

### If Database Migration Fails

```bash
# Rollback migration
npx prisma migrate resolve --rolled-back migration_name

# Restore from backup
# Use your database provider's restore feature

# Reapply migration
npx prisma migrate deploy
```

---

## Monitoring & Maintenance

### Daily Tasks
- [ ] Check error logs
- [ ] Monitor API response times
- [ ] Verify database backups
- [ ] Check disk space usage

### Weekly Tasks
- [ ] Review performance metrics
- [ ] Check security logs
- [ ] Update dependencies (if needed)
- [ ] Verify backup integrity

### Monthly Tasks
- [ ] Review and rotate secrets
- [ ] Analyze usage patterns
- [ ] Plan capacity upgrades
- [ ] Security audit

---

## Troubleshooting

### Common Issues

**Database Connection Error**
```
Error: P1001: Can't reach database server
Solution: Verify DATABASE_URL, check network connectivity, verify firewall rules
```

**JWT Token Invalid**
```
Error: jwt malformed
Solution: Verify JWT_SECRET matches between environments, check token expiry
```

**OpenAI API Error**
```
Error: Invalid API key
Solution: Verify OPENAI_API_KEY, check API quota, verify account status
```

**Out of Memory**
```
Error: JavaScript heap out of memory
Solution: Increase Node.js memory limit, optimize queries, enable caching
```

---

## Performance Optimization

### Database
- Add indexes on frequently queried columns
- Use connection pooling
- Implement query caching
- Archive old data

### Application
- Enable gzip compression
- Minify CSS/JavaScript
- Lazy load images
- Cache static assets

### Infrastructure
- Use CDN for static files
- Enable HTTP/2
- Configure caching headers
- Use load balancing

---

## Security Hardening

### Application Level
- [ ] Enable CORS restrictions
- [ ] Implement rate limiting
- [ ] Add request validation
- [ ] Enable CSRF protection
- [ ] Implement CSP headers

### Database Level
- [ ] Enable SSL connections
- [ ] Restrict user permissions
- [ ] Enable audit logging
- [ ] Regular backups
- [ ] Encryption at rest

### Infrastructure Level
- [ ] Use VPN for database access
- [ ] Enable WAF (Web Application Firewall)
- [ ] Configure DDoS protection
- [ ] Enable security headers
- [ ] Regular security audits

---

## Support & Escalation

### Emergency Contacts
- DevOps Lead: [contact]
- Database Admin: [contact]
- Security Team: [contact]

### Escalation Path
1. Check logs and monitoring
2. Contact on-call engineer
3. Initiate incident response
4. Document and post-mortem

---

## Success Criteria

Deployment is successful when:
- ✅ All API endpoints responding (200 OK)
- ✅ Database queries executing successfully
- ✅ Authentication working properly
- ✅ No critical errors in logs
- ✅ Performance metrics within acceptable range
- ✅ All health checks passing
- ✅ Users can access application
- ✅ AI features functioning correctly

---

**Deployment Date**: [Date]
**Deployed By**: [Name]
**Version**: [Version]
**Status**: Ready for Production

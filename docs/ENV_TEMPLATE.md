# Environment Variables Template

## Production Environment Setup

Copy this template to `.env.local` and fill in your production values.

```env
# ==========================================
# DATABASE CONFIGURATION
# ==========================================
DATABASE_URL="postgresql://username:password@host:5432/finberslink_prod"

# ==========================================
# AUTHENTICATION
# ==========================================
JWT_SECRET="your-secret-key-minimum-32-characters-long-for-security"
NEXTAUTH_URL="https://your-production-domain.com"
NEXTAUTH_SECRET="your-nextauth-secret-minimum-32-characters"

# ==========================================
# AI SERVICES
# ==========================================
OPENAI_API_KEY="sk-proj-your-openai-api-key-here"

# ==========================================
# EMAIL CONFIGURATION (Optional)
# ==========================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-specific-password"
SMTP_FROM="noreply@your-domain.com"

# ==========================================
# FILE STORAGE (Optional - AWS S3)
# ==========================================
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET="your-s3-bucket-name"
AWS_REGION="us-east-1"

# ==========================================
# MONITORING & LOGGING (Optional)
# ==========================================
SENTRY_DSN="your-sentry-dsn-for-error-tracking"
LOG_LEVEL="info"

# ==========================================
# APPLICATION SETTINGS
# ==========================================
NODE_ENV="production"
ENVIRONMENT="production"
```

## Development Environment Setup

For local development, use these values:

```env
# ==========================================
# DATABASE CONFIGURATION
# ==========================================
DATABASE_URL="postgresql://postgres:password@localhost:5432/finberslink_dev"

# ==========================================
# AUTHENTICATION
# ==========================================
JWT_SECRET="dev-secret-key-for-local-development-only"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-nextauth-secret-for-local-development"

# ==========================================
# AI SERVICES
# ==========================================
OPENAI_API_KEY="sk-proj-your-test-openai-key"

# ==========================================
# APPLICATION SETTINGS
# ==========================================
NODE_ENV="development"
ENVIRONMENT="development"
```

## Staging Environment Setup

For staging/testing, use these values:

```env
# ==========================================
# DATABASE CONFIGURATION
# ==========================================
DATABASE_URL="postgresql://username:password@staging-host:5432/finberslink_staging"

# ==========================================
# AUTHENTICATION
# ==========================================
JWT_SECRET="staging-secret-key-minimum-32-characters-long"
NEXTAUTH_URL="https://staging.your-domain.com"
NEXTAUTH_SECRET="staging-nextauth-secret-minimum-32-characters"

# ==========================================
# AI SERVICES
# ==========================================
OPENAI_API_KEY="sk-proj-your-staging-openai-key"

# ==========================================
# APPLICATION SETTINGS
# ==========================================
NODE_ENV="production"
ENVIRONMENT="staging"
```

## Environment Variable Descriptions

### DATABASE_URL
- **Description**: PostgreSQL connection string
- **Format**: `postgresql://user:password@host:port/database`
- **Example**: `postgresql://admin:pass123@db.neon.tech:5432/finberslink`
- **Security**: Store in secure vault, never commit to git

### JWT_SECRET
- **Description**: Secret key for JWT token signing
- **Requirements**: Minimum 32 characters, random, unique
- **Generation**: `openssl rand -base64 32`
- **Security**: Rotate every 90 days

### NEXTAUTH_URL
- **Description**: Application URL for authentication callbacks
- **Production**: `https://your-domain.com`
- **Development**: `http://localhost:3000`
- **Staging**: `https://staging.your-domain.com`

### NEXTAUTH_SECRET
- **Description**: Secret for NextAuth.js encryption
- **Requirements**: Minimum 32 characters, random, unique
- **Generation**: `openssl rand -base64 32`
- **Security**: Different from JWT_SECRET

### OPENAI_API_KEY
- **Description**: API key for OpenAI services
- **Format**: `sk-proj-...`
- **Security**: Store in secure vault, never commit to git
- **Monitoring**: Monitor usage and costs

### SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
- **Description**: Email service configuration
- **Provider**: Gmail, SendGrid, AWS SES, etc.
- **Security**: Use app-specific passwords, not main account password
- **Optional**: Only required if email notifications are enabled

### AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
- **Description**: AWS credentials for S3 file storage
- **Security**: Use IAM user with minimal permissions
- **Optional**: Only required if using AWS S3 for file storage

### SENTRY_DSN
- **Description**: Sentry error tracking DSN
- **Format**: `https://key@sentry.io/project-id`
- **Optional**: Only required if using Sentry for error tracking

## Security Best Practices

### Do's ✅
- ✅ Use strong, random values for secrets
- ✅ Store secrets in secure vault (AWS Secrets Manager, HashiCorp Vault, etc.)
- ✅ Rotate secrets every 90 days
- ✅ Use different secrets for each environment
- ✅ Enable audit logging for secret access
- ✅ Restrict access to environment variables
- ✅ Use environment-specific values

### Don'ts ❌
- ❌ Never commit secrets to git
- ❌ Never use weak or predictable secrets
- ❌ Never share secrets via email or chat
- ❌ Never reuse secrets across environments
- ❌ Never log sensitive values
- ❌ Never hardcode secrets in code
- ❌ Never use default or example values in production

## Generating Secure Secrets

### JWT_SECRET and NEXTAUTH_SECRET
```bash
# Generate 32-character random secret
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Database Password
```bash
# Generate strong password
openssl rand -base64 20

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(20).toString('base64'))"
```

## Verifying Environment Setup

### Check Required Variables
```bash
# Verify all required variables are set
env | grep -E "DATABASE_URL|JWT_SECRET|NEXTAUTH_URL|OPENAI_API_KEY"
```

### Test Database Connection
```bash
# Test PostgreSQL connection
psql $DATABASE_URL -c "SELECT 1"

# Or using Prisma
npx prisma db execute --stdin < /dev/null
```

### Test OpenAI API
```bash
# Test OpenAI API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

## Troubleshooting

### Database Connection Error
- Verify DATABASE_URL format
- Check network connectivity
- Verify firewall rules
- Test with psql command

### JWT Token Error
- Verify JWT_SECRET is set
- Check token expiry
- Verify secret matches between environments

### OpenAI API Error
- Verify OPENAI_API_KEY format
- Check API quota
- Verify account status
- Test with curl command

## Environment-Specific Notes

### Production
- Use strong, randomly generated secrets
- Enable monitoring and alerting
- Configure automated backups
- Enable SSL/TLS encryption
- Restrict database access
- Monitor API usage and costs

### Staging
- Use test/sandbox API keys
- Enable detailed logging
- Test all features thoroughly
- Verify performance
- Test disaster recovery

### Development
- Use local database
- Use test API keys
- Enable debug logging
- Disable rate limiting
- Use localhost URLs

## Checklist

Before deploying to production:
- [ ] All required variables are set
- [ ] Secrets are strong and random
- [ ] Database connection verified
- [ ] OpenAI API key validated
- [ ] Email configuration tested (if applicable)
- [ ] File storage configured (if applicable)
- [ ] Monitoring configured
- [ ] Backups enabled
- [ ] SSL/TLS configured
- [ ] Firewall rules configured

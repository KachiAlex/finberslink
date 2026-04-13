# PDF Generation Service

This directory contains the PDF generation infrastructure for the Resume Features Completion feature. It provides a complete solution for generating, caching, and storing resume PDFs with support for multiple templates.

## Architecture

The PDF service is built with a layered architecture:

```
┌─────────────────────────────────────────┐
│         PdfService (Facade)             │
│  - Orchestrates all components          │
│  - Handles caching logic                │
│  - Manages S3 storage                   │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌──────────┐
│PdfGen  │ │Cache   │ │S3Storage │
│        │ │        │ │          │
│Browser │ │In-Mem  │ │CloudFront│
│Pool    │ │TTL     │ │CDN       │
└────────┘ └────────┘ └──────────┘
```

## Components

### 1. PdfGenerator (`pdf-generator.ts`)

Manages Puppeteer browser instances with connection pooling and timeout handling.

**Features:**
- Connection pooling (max 5 concurrent instances by default)
- 30-second timeout per PDF generation
- Automatic resource cleanup
- Error handling and recovery

**Usage:**
```typescript
const generator = new PdfGenerator({
  maxConcurrentInstances: 5,
  timeoutMs: 30000,
});

await generator.initialize();
const pdfBuffer = await generator.generatePdf({
  htmlContent: '<html>...</html>',
  format: 'A4',
});
await generator.close();
```

### 2. PdfCache (`pdf-cache.ts`)

In-memory caching with TTL support for generated PDFs.

**Features:**
- 24-hour TTL by default
- Automatic cleanup of expired entries
- Content-based cache keys (SHA256 hash)
- Cache statistics and management

**Usage:**
```typescript
const cache = new PdfCache(86400); // 24 hours

const key = PdfCache.generateKey(resumeId, template, contentHash);
cache.set(key, pdfBuffer);
const cached = cache.get(key);
cache.invalidate(key);
```

### 3. S3Storage (`s3-storage.ts`)

AWS S3 integration for PDF storage with CloudFront CDN support.

**Features:**
- Upload PDFs to S3 with metadata
- Generate signed URLs for downloads
- CloudFront CDN integration for faster delivery
- Delete PDFs from S3
- Automatic key generation with timestamps

**Usage:**
```typescript
const s3 = new S3Storage({
  bucket: 'my-bucket',
  region: 'us-east-1',
  cloudFrontDomain: 'https://cdn.example.com',
});

const key = await s3.uploadPdf(pdfBuffer, 'resume.pdf', metadata);
const url = await s3.getPdfUrl(key);
await s3.deletePdf(key);
```

### 4. PdfService (`pdf-service.ts`)

Facade that orchestrates all components for a complete PDF export workflow.

**Features:**
- Unified API for PDF export
- Automatic caching and S3 storage
- Cache invalidation
- Service lifecycle management

**Usage:**
```typescript
const pdfService = await createPdfService();

const result = await pdfService.exportResumePdf({
  resumeId: 'resume-123',
  template: 'Modern',
  htmlContent: '<html>...</html>',
  fileName: 'John_Doe_Resume.pdf',
});

console.log(result.downloadUrl);
```

## Environment Configuration

Add these variables to `.env`:

```env
# PDF Generation
PDF_MAX_CONCURRENT_INSTANCES=5
PDF_GENERATION_TIMEOUT=30000
PDF_CACHE_TTL=86400

# AWS S3
AWS_REGION=us-east-1
AWS_S3_BUCKET=my-bucket
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_CLOUDFRONT_DOMAIN=https://cdn.example.com
AWS_SIGNED_URL_EXPIRATION=3600

# Redis (optional, for distributed caching)
REDIS_URL=redis://localhost:6379
```

## Installation

1. Install Puppeteer and dependencies:
```bash
npm install puppeteer bull redis
```

2. Configure AWS credentials in `.env`

3. Initialize the service:
```typescript
import { createPdfService } from '@/services/pdf/pdf-service';

const pdfService = await createPdfService();
```

## Performance Characteristics

- **PDF Generation**: < 5 seconds for typical resumes
- **Cache Hit**: < 100ms
- **S3 Upload**: 1-3 seconds depending on file size
- **CloudFront Delivery**: < 500ms from CDN

## Error Handling

The service provides comprehensive error handling:

- **Invalid Resume Data**: Returns 400 error
- **Template Not Found**: Returns 400 error
- **PDF Generation Timeout**: Returns 504 error
- **S3 Upload Failure**: Returns 500 error
- **File Size Exceeded**: Returns 413 error

## Testing

Run the test suite:

```bash
npm test -- __tests__/services/pdf/
```

Tests cover:
- PDF generation with valid HTML
- Timeout handling
- Error handling
- Browser pool management
- Cache operations
- S3 integration
- Service lifecycle

## Security Considerations

1. **Input Validation**: All HTML content is validated before PDF generation
2. **Resource Limits**: Connection pooling prevents resource exhaustion
3. **Timeout Protection**: 30-second timeout prevents hanging processes
4. **S3 Security**: Signed URLs expire after 1 hour
5. **CloudFront**: CDN provides DDoS protection and caching

## Monitoring and Logging

The service includes comprehensive logging:

```typescript
// Get cache statistics
const stats = pdfService.getCacheStats();
console.log(`Cache size: ${stats.size}`);
console.log(`Active instances: ${stats.activeInstances}`);
```

## Future Enhancements

1. **Redis Integration**: Distributed caching for multi-instance deployments
2. **Metrics Collection**: Prometheus metrics for monitoring
3. **Rate Limiting**: Per-user rate limiting for PDF exports
4. **Batch Processing**: Queue-based batch PDF generation
5. **Template Versioning**: Support for template updates without breaking existing PDFs

## Troubleshooting

### Puppeteer Installation Issues

If Puppeteer fails to install, try:
```bash
npm install puppeteer --no-save
npm install puppeteer --save
```

### Browser Launch Failures

Ensure system dependencies are installed:
```bash
# Ubuntu/Debian
sudo apt-get install -y libgconf-2-4 libatk1.0-0 libatk-bridge2.0-0 libgdk-pixbuf2.0-0 libgtk-3-0 libgbm-dev libxss-dev libnss3 libappindicator3-1 libindicator7 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxinerama1 libxrandr2 libxrender1 libxss1 libxtst6 fonts-liberation libappindicator1 libcurl3 lsb-release xdg-utils wget
```

### S3 Connection Issues

Verify AWS credentials:
```bash
aws s3 ls s3://your-bucket/
```

### Cache Not Working

Check cache TTL and cleanup interval:
```typescript
const cache = new PdfCache(86400);
console.log(`Cache size: ${cache.getSize()}`);
```

## References

- [Puppeteer Documentation](https://pptr.dev/)
- [AWS S3 SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)

# AI Interview Studio - Design Document

## Overview

This document specifies the technical design for completing the AI Interview Studio. It covers architecture, component structure, data models, and implementation approach for audio recording, question bank, testing, analytics, and UX improvements.

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/Next.js)                 │
├─────────────────────────────────────────────────────────────┤
│  Audio Recorder Component                                   │
│  Question Bank UI                                           │
│  Analytics Dashboard                                        │
│  Interview Session View                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              API Layer (Next.js Routes)                     │
├─────────────────────────────────────────────────────────────┤
│  Audio Upload Endpoint                                      │
│  Question Bank Endpoints                                    │
│  Analytics Endpoints                                        │
│  Existing Interview Endpoints                               │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│           Service Layer (Business Logic)                    │
├─────────────────────────────────────────────────────────────┤
│  Audio Service (upload, storage, cleanup)                   │
│  Question Bank Service (templates, CRUD)                    │
│  Analytics Service (scoring, trends, skills)                │
│  Existing Interview Service                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│           External Services & Storage                       │
├─────────────────────────────────────────────────────────────┤
│  Firebase Storage (audio files)                             │
│  OpenAI API (transcription, feedback)                       │
│  PostgreSQL Database                                        │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Components

```
InterviewPrepDashboard
├─ SessionList
│  ├─ SessionCard
│  └─ CreateSessionModal
│     ├─ RoleSelector
│     ├─ QuestionBankSelector
│     └─ ResumeJobSelector
├─ AnalyticsDashboard
│  ├─ ScoreTrendChart
│  ├─ SkillAnalysis
│  └─ ComparisonReport
└─ InterviewSessionView
   ├─ QuestionTimeline
   ├─ RecorderWorkspace
   │  ├─ AudioRecorder (NEW)
   │  ├─ AudioPlayback (NEW)
   │  └─ TranscriptDisplay
   ├─ FeedbackPanel
   └─ SessionReflection
```

### New Components to Build

1. **AudioRecorder** - WebRTC-based audio recording
2. **AudioPlayback** - Audio player with controls
3. **QuestionBankSelector** - UI for selecting pre-built questions
4. **AnalyticsDashboard** - Performance tracking and visualization
5. **ScoreTrendChart** - Chart showing score progression
6. **SkillAnalysis** - Display of extracted skills
7. **ComparisonReport** - Benchmarking against role average

## Data Models

### New Database Tables

#### QuestionTemplate
```prisma
model QuestionTemplate {
  id              String   @id @default(cuid())
  prompt          String
  category        String   // "behavioral", "technical", "situational"
  difficulty      String   // "easy", "medium", "hard"
  targetRole      String   // "Software Engineer", "Product Manager", etc.
  rubric          Json?    // Grading criteria
  estimatedTime   Int      // Seconds
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model InterviewAnalytics {
  id              String   @id @default(cuid())
  sessionId       String   @unique
  session         InterviewSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  userId          String
  overallScore    Float    // Average of all response scores
  skillsExtracted Json     // { "communication": 4.2, "problem-solving": 3.8 }
  completedAt     DateTime
  createdAt       DateTime @default(now())
}

model AudioFile {
  id              String   @id @default(cuid())
  responseId      String   @unique
  response        InterviewResponse @relation(fields: [responseId], references: [id], onDelete: Cascade)
  storageUrl      String   // Firebase Storage URL
  signedUrl       String   // Signed URL (expires in 24h)
  fileSize        Int      // Bytes
  duration        Int      // Seconds
  uploadedAt      DateTime
  expiresAt       DateTime // When signed URL expires
  createdAt       DateTime @default(now())
}
```

### Updated Database Tables

#### InterviewResponse
```prisma
model InterviewResponse {
  id             String       @id @default(cuid())
  questionId     String
  question       InterviewQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
  transcript     String
  audioUrl       String?      // Deprecated - use AudioFile.signedUrl
  audioFile      AudioFile?   // NEW: Relation to AudioFile
  aiFeedback     String?
  score          Int?         // 1-5
  submittedAt    DateTime
  createdAt      DateTime @default(now())
}

model InterviewQuestion {
  id             String               @id @default(cuid())
  sessionId      String
  session        InterviewSession     @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  prompt         String
  sequence       Int
  rubric         Json?
  templateId     String?              // NEW: Link to QuestionTemplate
  template       QuestionTemplate?    @relation(fields: [templateId], references: [id])
  responses      InterviewResponse[]
  createdAt      DateTime @default(now())
}
```

## Service Layer Design

### Audio Service (`src/features/interview/audio-service.ts`)

```typescript
// Upload audio to Firebase Storage
async function uploadAudioFile(options: {
  buffer: Buffer;
  filename: string;
  responseId: string;
}): Promise<{ storageUrl: string; signedUrl: string; duration: number }>

// Generate signed URL for audio access
async function generateSignedUrl(storageUrl: string): Promise<string>

// Delete audio file from storage
async function deleteAudioFile(storageUrl: string): Promise<void>

// Get audio duration
async function getAudioDuration(buffer: Buffer): Promise<number>

// Cleanup expired audio files
async function cleanupExpiredAudioFiles(): Promise<number>
```

### Question Bank Service (`src/features/interview/question-bank-service.ts`)

```typescript
// Get question templates by role
async function getQuestionsByRole(role: string): Promise<QuestionTemplate[]>

// Get all question templates with filters
async function getQuestionTemplates(filters?: {
  role?: string;
  category?: string;
  difficulty?: string;
}): Promise<QuestionTemplate[]>

// Create custom question template
async function createQuestionTemplate(input: {
  prompt: string;
  category: string;
  difficulty: string;
  targetRole: string;
  rubric?: Json;
  estimatedTime?: number;
}): Promise<QuestionTemplate>

// Seed default question templates
async function seedDefaultQuestions(): Promise<void>
```

### Analytics Service (`src/features/interview/analytics-service.ts`)

```typescript
// Calculate overall score for session
async function calculateSessionScore(sessionId: string): Promise<number>

// Extract skills from responses
async function extractSkillsFromSession(sessionId: string): Promise<Record<string, number>>

// Get user's score trends
async function getUserScoreTrends(userId: string, limit?: number): Promise<Array<{
  date: Date;
  score: number;
  role: string;
}>>

// Get role average score
async function getRoleAverageScore(role: string): Promise<number>

// Get user's percentile for role
async function getUserPercentile(userId: string, role: string): Promise<number>

// Get analytics for session
async function getSessionAnalytics(sessionId: string): Promise<{
  overallScore: number;
  skillsExtracted: Record<string, number>;
  completedAt: Date;
}>
```

## API Endpoints

### New Audio Endpoints

```
POST /api/interview-sessions/[sessionId]/responses/upload
- Upload audio file for a response
- Request: FormData with audio file
- Response: { audioUrl, signedUrl, duration, transcript }

GET /api/interview-sessions/[sessionId]/responses/[responseId]/audio
- Get signed URL for audio playback
- Response: { signedUrl, expiresAt }
```

### New Question Bank Endpoints

```
GET /api/interview/question-templates
- Get all question templates with optional filters
- Query: ?role=Software%20Engineer&difficulty=medium
- Response: { templates: QuestionTemplate[] }

GET /api/interview/question-templates/by-role/[role]
- Get default questions for a role
- Response: { templates: QuestionTemplate[] }

POST /api/interview/question-templates
- Create custom question template (admin only)
- Request: { prompt, category, difficulty, targetRole, rubric, estimatedTime }
- Response: { template: QuestionTemplate }
```

### New Analytics Endpoints

```
GET /api/interview/analytics/user
- Get user's analytics dashboard data
- Response: { scoreTrends, skillAnalysis, averageScore }

GET /api/interview/analytics/session/[sessionId]
- Get analytics for specific session
- Response: { overallScore, skillsExtracted, completedAt }

GET /api/interview/analytics/role/[role]/average
- Get average score for a role
- Response: { averageScore, percentile }
```

## Implementation Phases

### Phase 1: Audio Recording & Storage (Week 1)
1. Create AudioRecorder component with WebRTC
2. Implement audio upload to Firebase Storage
3. Create audio service for storage management
4. Add audio playback component
5. Update API to handle audio uploads
6. Add audio cleanup on session deletion

### Phase 2: Question Bank (Week 1-2)
1. Create QuestionTemplate model and migrations
2. Seed default question templates for 10+ roles
3. Create question bank service
4. Build QuestionBankSelector component
5. Add question template API endpoints
6. Update session creation to support template selection

### Phase 3: Testing (Week 2-3)
1. Write unit tests for all services
2. Write API integration tests
3. Write component tests for new UI
4. Achieve 80%+ code coverage
5. Set up CI/CD for test automation

### Phase 4: Analytics (Week 3)
1. Create analytics service
2. Build analytics dashboard components
3. Implement score trend visualization
4. Add skill extraction and analysis
5. Create comparison reports

### Phase 5: UX Polish (Week 3-4)
1. Add loading states and skeletons
2. Improve error handling and messages
3. Create empty state designs
4. Add accessibility features (ARIA, keyboard nav)
5. Mobile responsiveness optimization

## Technology Stack

### Frontend
- React 18+ with TypeScript
- Next.js 14+ for routing
- Tailwind CSS for styling
- Recharts for data visualization
- React Hook Form for forms
- Zod for validation

### Backend
- Next.js API routes
- Prisma ORM
- PostgreSQL database
- Firebase Storage for audio
- OpenAI API for transcription/feedback

### Testing
- Jest for unit tests
- React Testing Library for component tests
- Supertest for API tests
- MSW for API mocking

### Audio
- Web Audio API for recording
- MediaRecorder API for encoding
- Firebase Storage SDK for upload
- Howler.js for playback

## Security Considerations

### Audio Storage
- Encrypt audio files at rest in Firebase Storage
- Use signed URLs with 24-hour expiration
- Validate file size before upload (max 25MB)
- Scan uploaded files for malware

### Access Control
- Users can only access their own sessions and audio
- Audio URLs are signed and user-specific
- API endpoints validate user ownership
- Audio files are deleted when session is deleted

### Data Privacy
- Audio transcripts are stored in database
- Audio files are stored separately in cloud storage
- Users can request data deletion
- Comply with GDPR/CCPA requirements

## Performance Optimization

### Frontend
- Lazy load analytics components
- Virtualize long lists of sessions
- Cache question templates
- Debounce audio upload progress updates

### Backend
- Index frequently queried fields (userId, sessionId, role)
- Cache question templates in memory
- Batch AI API calls for efficiency
- Use database connection pooling

### Audio
- Compress audio before upload (WebM codec)
- Use multipart upload for large files
- Implement resumable uploads
- Cache signed URLs for 1 hour

## Monitoring & Logging

### Metrics to Track
- Audio upload success rate
- AI feedback generation latency
- API response times
- Error rates by endpoint
- User session completion rate

### Logging
- Log all audio uploads with file size and duration
- Log AI API calls and response times
- Log errors with full stack traces
- Log user actions for analytics

## Rollout Strategy

### Phase 1: Internal Testing
- Deploy to staging environment
- Test with internal team
- Gather feedback and iterate

### Phase 2: Beta Release
- Release to 10% of users
- Monitor metrics and errors
- Gather user feedback

### Phase 3: Full Release
- Release to all users
- Monitor adoption and engagement
- Support and iterate based on feedback


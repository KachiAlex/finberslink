# AI Interview Studio - Design Document

## Overview

This document outlines the technical design for implementing the missing features of the AI Interview Studio. The implementation focuses on audio recording/playback, question templates, testing, analytics, and UX polish.

---

## Phase 1: Audio Recording & Playback

### 1.1 Audio Recorder Component Architecture

```typescript
// Component: AudioRecorder
// Location: src/features/interview/components/audio-recorder.tsx

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => Promise<void>;
  onError: (error: Error) => void;
  maxDuration?: number; // seconds
  disabled?: boolean;
}

interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // seconds
  isUploading: boolean;
  uploadProgress: number; // 0-100
  error: string | null;
}

// Key Methods:
- startRecording(): void
- stopRecording(): void
- pauseRecording(): void
- resumeRecording(): void
- cancelRecording(): void
- uploadAudio(blob: Blob): Promise<string> // returns audioUrl
```

### 1.2 Audio Playback Component

```typescript
// Component: AudioPlayer
// Location: src/features/interview/components/audio-player.tsx

interface AudioPlayerProps {
  audioUrl: string;
  duration?: number;
  onError?: (error: Error) => void;
}

interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  error: string | null;
}

// Key Methods:
- play(): void
- pause(): void
- seek(time: number): void
- setVolume(volume: number): void
```

### 1.3 Audio Storage Service

```typescript
// Service: AudioStorageService
// Location: src/features/interview/audio-storage.ts

interface AudioUploadOptions {
  userId: string;
  sessionId: string;
  questionId: string;
  audioBlob: Blob;
  duration: number;
}

interface AudioMetadata {
  audioUrl: string;
  duration: number;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  expiresAt: Date;
}

// Key Methods:
- uploadAudio(options: AudioUploadOptions): Promise<AudioMetadata>
- getAudioUrl(audioId: string): Promise<string>
- deleteAudio(audioId: string): Promise<void>
- generateSignedUrl(audioId: string, expiresIn: number): Promise<string>
```

### 1.4 Database Schema Updates

```prisma
model InterviewResponse {
  id               String    @id @default(cuid())
  questionId       String
  question         InterviewQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
  
  transcript       String
  audioUrl         String?   // URL to uploaded audio
  audioMetadata    Json?     // { duration, fileSize, mimeType, uploadedAt }
  
  aiFeedback       String?
  score            Int?      // 1-5
  
  submittedAt      DateTime  @default(now())
  
  @@index([questionId])
}
```

### 1.5 API Endpoints for Audio

```typescript
// POST /api/interview-sessions/[sessionId]/responses/upload
// Upload audio file and get signed URL
// Request: FormData with audio blob
// Response: { audioUrl: string, duration: number, fileSize: number }

// GET /api/interview-sessions/[sessionId]/responses/[responseId]/audio
// Get audio metadata and signed URL
// Response: { audioUrl: string, duration: number, expiresAt: Date }

// DELETE /api/interview-sessions/[sessionId]/responses/[responseId]/audio
// Delete audio file from storage
// Response: { success: boolean }
```

---

## Phase 2: Question Bank & Templates

### 2.1 Question Template Data Structure

```typescript
// Type: QuestionTemplate
// Location: src/types/interview.ts

interface QuestionTemplate {
  id: string;
  role: string; // "Software Engineer", "Product Manager", etc.
  category: "BEHAVIORAL" | "TECHNICAL" | "SITUATIONAL" | "COMPETENCY";
  difficulty: "ENTRY" | "MID" | "SENIOR";
  prompt: string;
  rubric?: {
    criteria: Array<{
      name: string;
      description: string;
      weight: number; // 0-1
    }>;
    scoringGuide?: string;
  };
  tips?: string[];
  expectedDuration?: number; // seconds
  createdAt: Date;
  updatedAt: Date;
}

// Seed Data: 50+ templates across 7 roles
// - Software Engineer (15 questions)
// - Product Manager (10 questions)
// - Data Analyst (8 questions)
// - Designer (8 questions)
// - Sales (5 questions)
// - Marketing (5 questions)
// - Finance (5 questions)
```

### 2.2 Question Template Service

```typescript
// Service: QuestionTemplateService
// Location: src/features/interview/question-templates.ts

interface GetTemplatesOptions {
  role?: string;
  category?: string;
  difficulty?: string;
  limit?: number;
}

// Key Methods:
- getTemplates(options: GetTemplatesOptions): Promise<QuestionTemplate[]>
- getTemplatesByRole(role: string): Promise<QuestionTemplate[]>
- getTemplatesByCategory(category: string): Promise<QuestionTemplate[]>
- getRandomTemplates(role: string, count: number): Promise<QuestionTemplate[]>
- seedTemplates(): Promise<void> // Initialize database with templates
```

### 2.3 Database Schema for Templates

```prisma
model QuestionTemplate {
  id           String   @id @default(cuid())
  role         String   // "Software Engineer", etc.
  category     String   // "BEHAVIORAL", "TECHNICAL", etc.
  difficulty   String   // "ENTRY", "MID", "SENIOR"
  prompt       String
  rubric       Json?
  tips         String[]
  expectedDuration Int? // seconds
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@index([role])
  @@index([category])
  @@index([difficulty])
}
```

### 2.4 Question Selection Flow

```
User Creates Interview
  ↓
Select Target Role
  ↓
Choose Question Source:
  ├─ Use Template (auto-populate)
  ├─ Custom Questions (manual entry)
  └─ Mix (template + custom)
  ↓
If Template Selected:
  ├─ Fetch templates for role
  ├─ Filter by difficulty (optional)
  ├─ Display 5-10 questions
  └─ User selects which to use
  ↓
Questions Added to Session
```

### 2.5 API Endpoints for Templates

```typescript
// GET /api/interview/question-templates
// Get available question templates
// Query: ?role=Software%20Engineer&difficulty=MID&limit=10
// Response: { templates: QuestionTemplate[] }

// GET /api/interview/question-templates/roles
// Get list of available roles
// Response: { roles: string[] }

// POST /api/interview/question-templates/seed
// Initialize database with seed templates (admin only)
// Response: { count: number, message: string }
```

---

## Phase 3: Testing & Quality Assurance

### 3.1 Test Structure

```
__tests__/
├── features/
│   └── interview/
│       ├── service.test.ts (unit tests)
│       ├── ai.test.ts (AI integration tests)
│       ├── audio-storage.test.ts (storage tests)
│       └── question-templates.test.ts (template tests)
├── api/
│   └── interview-sessions/
│       ├── route.test.ts (POST/GET tests)
│       ├── [sessionId]/route.test.ts (PATCH tests)
│       ├── [sessionId]/questions/route.test.ts
│       ├── [sessionId]/responses/route.test.ts
│       └── [sessionId]/responses/upload.test.ts
└── components/
    └── interview/
        ├── audio-recorder.test.tsx
        ├── audio-player.test.tsx
        └── interview-dashboard.test.tsx
```

### 3.2 Test Coverage Targets

```
Service Layer:     >85%
API Endpoints:     >80%
Components:        >75%
AI Integration:    >80%
Overall:           >80%
```

### 3.3 Test Examples

```typescript
// Unit Test Example: Service Layer
describe('InterviewService', () => {
  it('should create interview session with questions', async () => {
    const session = await createInterviewSession({
      userId: 'user-1',
      targetRole: 'Software Engineer',
      initialQuestion: { prompt: 'Tell me about yourself' }
    });
    
    expect(session.id).toBeDefined();
    expect(session.questions).toHaveLength(1);
    expect(session.status).toBe('ACTIVE');
  });
  
  it('should throw error if user not found', async () => {
    await expect(
      createInterviewSession({
        userId: 'invalid-user',
        targetRole: 'Software Engineer'
      })
    ).rejects.toThrow('User not found');
  });
});

// API Test Example
describe('POST /api/interview-sessions', () => {
  it('should create session with valid input', async () => {
    const response = await fetch('/api/interview-sessions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer token' },
      body: JSON.stringify({
        targetRole: 'Software Engineer',
        initialQuestion: { prompt: 'Tell me about yourself' }
      })
    });
    
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.session.id).toBeDefined();
  });
  
  it('should return 401 if not authenticated', async () => {
    const response = await fetch('/api/interview-sessions', {
      method: 'POST',
      body: JSON.stringify({ targetRole: 'Software Engineer' })
    });
    
    expect(response.status).toBe(401);
  });
});

// Component Test Example
describe('AudioRecorder', () => {
  it('should start recording when button clicked', async () => {
    const { getByRole } = render(<AudioRecorder onRecordingComplete={jest.fn()} />);
    const recordButton = getByRole('button', { name: /record/i });
    
    fireEvent.click(recordButton);
    
    expect(recordButton).toHaveAttribute('aria-pressed', 'true');
  });
});
```

---

## Phase 4: Analytics & Reporting

### 4.1 Analytics Data Model

```typescript
interface InterviewAnalytics {
  sessionId: string;
  userId: string;
  
  // Overall metrics
  overallScore: number; // 1-5 average
  completionTime: number; // seconds
  questionsAnswered: number;
  questionsTotal: number;
  
  // Per-question metrics
  questionScores: Array<{
    questionId: string;
    score: number;
    duration: number;
  }>;
  
  // Trends
  averageScoreTrend: number[]; // last 10 sessions
  improvementRate: number; // percentage
  
  // Metadata
  targetRole: string;
  difficulty: string;
  createdAt: Date;
}
```

### 4.2 Analytics Service

```typescript
// Service: InterviewAnalyticsService
// Location: src/features/interview/analytics.ts

// Key Methods:
- calculateSessionAnalytics(sessionId: string): Promise<InterviewAnalytics>
- getUserAnalytics(userId: string): Promise<InterviewAnalytics[]>
- getProgressTrend(userId: string, days: number): Promise<TrendData>
- generateReport(sessionId: string): Promise<InterviewReport>
- exportReportPDF(sessionId: string): Promise<Buffer>
```

### 4.3 Database Schema for Analytics

```prisma
model InterviewAnalytics {
  id               String   @id @default(cuid())
  sessionId        String   @unique
  session          InterviewSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  overallScore     Float
  completionTime   Int      // seconds
  questionsAnswered Int
  questionsTotal   Int
  
  questionScores   Json     // Array of { questionId, score, duration }
  averageScoreTrend Json    // Array of scores
  improvementRate  Float?
  
  createdAt        DateTime @default(now())
  
  @@index([sessionId])
}
```

### 4.4 Report Generation

```typescript
interface InterviewReport {
  sessionId: string;
  targetRole: string;
  completedAt: Date;
  
  overallScore: number;
  completionTime: number;
  
  questionResults: Array<{
    prompt: string;
    score: number;
    feedback: string;
    duration: number;
  }>;
  
  summary: string;
  recommendations: string[];
  
  generatedAt: Date;
}

// PDF Export using: pdfkit or puppeteer
// Email Export using: nodemailer or SendGrid
```

---

## Phase 5: UX Polish & Accessibility

### 5.1 Component Enhancements

```typescript
// Enhanced InterviewSessionView with:
- Loading skeleton for questions
- Error boundary with retry
- Empty state for no questions
- Toast notifications for actions
- Keyboard shortcuts (Ctrl+R to record, Esc to cancel)
- Accessibility attributes (aria-label, aria-describedby, etc.)

// Enhanced AudioRecorder with:
- Visual waveform during recording
- Time limit warning (e.g., "2 minutes remaining")
- Microphone permission request UI
- Network status indicator
- Retry logic for failed uploads

// Enhanced AudioPlayer with:
- Waveform visualization
- Playback speed control (0.75x, 1x, 1.25x, 1.5x)
- Volume control
- Keyboard shortcuts (Space to play/pause, Arrow keys to seek)
- Closed captions (if available)
```

### 5.2 Accessibility Checklist

```
✓ Keyboard Navigation
  - All interactive elements are focusable
  - Tab order is logical
  - Escape closes modals
  - Enter activates buttons

✓ Screen Reader Support
  - All images have alt text
  - Form labels are associated
  - Buttons have descriptive text
  - Loading states are announced
  - Errors are announced

✓ Color Contrast
  - Text contrast ratio ≥ 4.5:1
  - UI elements contrast ratio ≥ 3:1
  - Color is not the only indicator

✓ Mobile Responsiveness
  - Touch targets ≥ 48px
  - Text is readable without zoom
  - Orientation changes work
  - All features work on mobile
```

### 5.3 Error Handling UI

```typescript
// Error Boundary Component
<ErrorBoundary
  fallback={<ErrorFallback />}
  onError={(error) => logError(error)}
>
  <InterviewSessionView />
</ErrorBoundary>

// Toast Notifications
- Success: "Response recorded successfully"
- Error: "Failed to upload audio. Retrying..."
- Warning: "Your session will expire in 5 minutes"
- Info: "AI is generating feedback..."

// Inline Error Messages
- "Microphone permission denied. Please enable in settings."
- "Audio upload failed. Check your connection and try again."
- "AI feedback generation failed. Using default feedback."
```

---

## Implementation Priority

### Week 1: Audio Recording & Playback
- Audio Recorder component
- Audio Player component
- Audio Storage service
- Firebase/S3 integration

### Week 2: Question Templates
- Question Template data model
- Seed templates (50+ questions)
- Template selection UI
- Template service

### Week 3: Testing
- Unit tests for services
- API endpoint tests
- Component tests
- Integration tests

### Week 4: Analytics & UX Polish
- Analytics service
- Report generation
- PDF export
- Accessibility improvements
- Mobile optimization

---

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Next.js, Prisma, PostgreSQL
- **Audio**: MediaRecorder API, Web Audio API
- **Storage**: Firebase Storage or AWS S3
- **AI**: OpenAI (Whisper, GPT-4o-mini)
- **Testing**: Jest, React Testing Library, Supertest
- **PDF**: pdfkit or puppeteer
- **Email**: nodemailer or SendGrid

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Audio upload failures | Implement retry logic with exponential backoff |
| AI feedback delays | Cache common responses, provide default feedback |
| Storage costs | Implement audio expiration (90 days), compression |
| Mobile audio issues | Test on multiple devices, provide fallback |
| Accessibility issues | Use automated testing + manual review |
| Performance degradation | Implement pagination, lazy loading, caching |


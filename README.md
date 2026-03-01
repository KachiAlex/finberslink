# Finbers Link - Skill-to-Employment Digital Ecosystem

A comprehensive Learning Management System (LMS) platform that connects learners, tutors, and employers through skill development, resume building, and opportunity matching.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control (Student, Tutor, Admin)
- **Learning Management**: Course enrollment, lessons, progress tracking, and certificates
- **Resume Studio**: AI-powered resume builder with public profiles
- **Forum & Community**: Threaded discussions, moderation, and peer interaction
- **Opportunity Matching**: Job and volunteer opportunity applications
- **Notifications**: Real-time alerts and updates
- **Search**: Unified search across courses, jobs, forum, and news
- **Admin Dashboard**: Complete platform management and analytics
- **Help Center**: Role-specific guides and documentation

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Radix UI components
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: PostgreSQL
- **Auth**: JWT tokens with httpOnly cookies
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm/yarn/pnpm

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/KachiAlex/finberslink.git
cd finberslink
npm install
```

### 2. Environment Setup

Copy the environment template:

```bash
cp env.example .env.local
```

Configure your environment variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/finberslink"

# JWT Secrets (generate secure random strings)
JWT_ACCESS_SECRET="your-super-secret-access-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars"

# App Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# Optional: External Services
OPENAI_API_KEY="sk-..."
SENDGRID_API_KEY="SG...."
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database with sample data
npx prisma db seed
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login  
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Dashboard Endpoints

- `GET /api/dashboard` - Student dashboard data
- `GET /api/admin/overview` - Admin overview (admin only)
- `GET /api/tutor/cohorts` - Tutor cohorts (tutor only)

### Content Endpoints

- `GET /api/courses` - List courses
- `GET /api/news` - News articles
- `GET /api/search?q=query` - Search across content
- `GET /api/notifications` - User notifications

### Forum Endpoints

- `GET /api/forum/threads` - List forum threads
- `POST /api/forum/threads` - Create thread
- `GET /api/forum/threads/[id]` - Get thread details
- `POST /api/forum/threads/[id]` - Reply to thread

## 🏗️ Architecture

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── dashboard/         # Student dashboard  
│   ├── tutor/             # Tutor dashboard
│   └── (auth pages)       # Login, register, etc.
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   └── notifications/    # Notification components
├── features/             # Feature modules
│   ├── auth/             # Authentication logic
│   ├── admin/            # Admin services
│   ├── dashboard/        # Dashboard services
│   ├── forum/            # Forum services
│   ├── news/             # News services
│   ├── resume/           # Resume builder
│   └── search/           # Search functionality
└── lib/                  # Shared utilities
    ├── auth/             # JWT & password helpers
    └── prisma.ts         # Database client
```

### Authentication Flow

1. User registers/logs in via API routes
2. JWT tokens (access + refresh) set as httpOnly cookies
3. Middleware verifies tokens for protected routes
4. Role-based access control enforced per route
5. Token refresh handled automatically

### Data Models

Key Prisma models include:
- `User` - Authentication and profiles
- `Course` & `Lesson` - Learning content
- `Enrollment` & `LessonProgress` - Student progress
- `ForumThread` & `ForumPost` - Discussions
- `Resume` & `Experience` - Resume data
- `JobOpportunity` & `Application` - Opportunities
- `Notification` - User notifications

## 🧪 Development

### Database Migrations

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

### Code Quality

```bash
# Run linting
npm run lint

# Type checking
npm run type-check
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📱 Default Accounts

After running the seed script, you can use these accounts:

- **Admin**: admin@finbers.com (password: demo)
- **Tutor**: instructor@finbers.com (password: demo)  
- **Student**: student@finbers.com (password: demo)
- **Employer**: employer@finbers.com (password: demo)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Help Center](/help) - In-app guides and documentation
- 💬 [Community Forum](/forum) - Ask questions and share insights
- 📧 support@finberslink.com - Direct support contact

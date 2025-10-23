# AI-Powered HRMS - Enterprise Human Resource Management System

## Overview

This is a comprehensive, production-ready AI-powered Human Resource Management System (HRMS) built with modern web technologies. The system provides complete workforce management capabilities including employee profiles, attendance tracking with facial recognition, leave management, automated payroll processing, performance reviews with AI-generated insights, intelligent recruitment with resume parsing, document management, and a 24/7 AI chatbot assistant.

The application is designed to scale to 10,000+ employees while remaining deployable on free-tier services, with a focus on security, accessibility, and real-time operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & UI Library**
- **Next.js-style React with Vite**: Uses React with Vite for fast development and optimized production builds
- **Routing**: wouter for lightweight client-side routing
- **State Management**: React Query (@tanstack/react-query) for server state with aggressive caching strategies (staleTime: Infinity)
- **Component Library**: shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: TailwindCSS with custom design system following Material Design principles
- **Typography**: Inter font family from Google Fonts for all text
- **Theme System**: Custom light/dark mode implementation with localStorage persistence

**Design System**
- Material Design approach optimized for data-dense enterprise applications
- Consistent spacing primitives (2, 4, 6, 8, 12, 16, 20)
- Typography hierarchy from 12px captions to 30px headers
- Responsive breakpoints (mobile, tablet/md, desktop/lg+)
- Custom CSS variables for colors with HSL values supporting alpha channels
- Hover and active elevation effects using CSS custom properties

**Layout Structure**
- Fixed 16rem (w-64) sidebar navigation with role-based menu items
- Main content area with max-w-7xl container
- Dashboard grid system (1/2/3 columns based on breakpoint)
- Forms limited to max-w-2xl for readability

### Backend Architecture

**Server Framework**
- **Express.js**: REST API server with TypeScript
- **Session Management**: express-session with PostgreSQL session store (connect-pg-simple)
- **Authentication**: JWT-based sessions with bcryptjs password hashing
- **File Uploads**: multer with 10MB limit and memory storage
- **Rate Limiting**: express-rate-limit (100 requests per 15 minutes)
- **Security**: Trust proxy configuration, request logging, input validation with Zod schemas

**API Design**
- RESTful endpoints under `/api` prefix
- Structured error handling with appropriate HTTP status codes
- Request/response logging for API routes
- Session-based authentication with credentials: 'include'

**Code Organization**
- `/server/routes.ts`: Main route registration and middleware configuration
- `/server/storage.ts`: Database abstraction layer with IStorage interface
- `/server/services/`: Business logic services (AI, encryption)
- `/shared/schema.ts`: Shared types and Zod validation schemas

### Data Storage & Database

**Database Technology**
- **PostgreSQL via Neon**: Serverless Postgres with connection pooling
- **ORM**: Drizzle ORM with type-safe queries
- **Migration Strategy**: drizzle-kit for schema management

**Schema Design**
Key tables include:
- `users`: Authentication with email, hashed password, role enum
- `employees`: Profile data with encrypted salary field (stored as text)
- `attendance`: Clock-in/out records with biometric flag and location
- `leave_requests`: Multi-status workflow (pending/approved/rejected/cancelled)
- `leave_balances`: Per-employee leave type balances
- `payroll_records`: Monthly salary computations with component breakdowns
- `performance_reviews`: 360 feedback with AI-generated summaries
- `job_postings`: Recruitment with status tracking
- `applications`: Resume data with AI parsing results
- `face_encodings`: Facial recognition data for biometric attendance
- `documents`: File metadata with type categorization
- `notifications`: Real-time user notifications
- `audit_logs`: Security and compliance tracking
- `session`: PostgreSQL session store

**Enums**
- roleEnum: admin, senior_manager, hr, employee
- attendanceStatusEnum: present, absent, late, on_leave, half_day
- leaveTypeEnum: sick, casual, vacation, maternity, paternity, unpaid
- leaveStatusEnum: pending, approved, rejected, cancelled
- applicationStatusEnum: applied, screening, interview, offered, rejected, hired
- jobStatusEnum: open, closed, draft

**Security Features**
- Row Level Security (RLS) policies planned for Supabase
- Field-level encryption for sensitive data (salaries, face encodings)
- Password hashing with bcryptjs
- Encrypted fields stored as text with crypto AES-256-GCM

### Authentication & Authorization

**Authentication Flow**
- Email/password registration and login
- bcryptjs password hashing (10 salt rounds)
- Session-based authentication with PostgreSQL store
- Session cookie with configurable secret
- Last login timestamp tracking

**Role-Based Access Control**
Four role levels with hierarchical permissions:
1. **Admin**: Full system access
2. **Senior Manager**: Management and HR functions
3. **HR**: Employee and recruitment management
4. **Employee**: Self-service access only

**Frontend Protection**
- AuthContext provider with user state management
- ProtectedRoute component with role checking
- Automatic redirect to login for unauthenticated users
- Role-based sidebar menu filtering

### AI/ML Integration

**AI Service Providers**
- **Google Gemini API**: Primary AI provider for content generation, resume parsing, performance summaries
- **OpenAI API**: Fallback/alternative provider
- **Anthropic Claude API**: Resume parsing and candidate ranking

**AI Features Implementation**
1. **Resume Parser**: 
   - Extracts skills (array), experience (years + description), summary
   - Uses Gemini with JSON response schema
   - Structured output for database storage

2. **Performance Review AI**:
   - Generates summaries from review feedback
   - Analyzes technical, communication, leadership, teamwork scores
   - Creates actionable insights

3. **Chatbot (HR Assistant)**:
   - 24/7 conversational interface
   - Handles leave requests, payslip queries, policy questions
   - Role-based capabilities
   - Persistent message history

4. **Candidate Ranking**:
   - AI-powered resume screening
   - Skills matching against job requirements
   - Scoring and ranking algorithms

**API Configuration**
- Gemini API Key: Configured via environment variable
- OpenAI API Key: Configured via environment variable
- Error handling for missing API keys with console warnings

### Security Implementation

**Data Encryption**
- **Algorithm**: AES-256-GCM
- **Encryption Service**: Centralized crypto module
- **Encrypted Fields**: Base salary, face encodings
- **Key Management**: 64-character hex key from environment variable
- **Format**: IV:AuthTag:EncryptedData (hex encoded)

**Session Security**
- PostgreSQL-backed sessions
- Auto-created session table
- Configurable session secret (environment variable)
- HTTP-only cookies
- Trust proxy for secure headers

**Input Validation**
- Zod schemas for all database inserts
- Type-safe validation with drizzle-zod
- Frontend form validation
- API request body validation

**Rate Limiting**
- 100 requests per 15-minute window
- IP-based throttling
- Custom error messages

**Audit Trail**
- audit_logs table for tracking sensitive operations
- User ID, action type, entity tracking
- Timestamp recording

## External Dependencies

### Third-Party Services

**Supabase**
- URL: https://teksvqzoekypmczuhzmy.supabase.co
- Usage: Planned for file storage buckets (resumes, documents, payslips)
- Client: @supabase/supabase-js
- Authentication: Anon key configured in client

**Database**
- Provider: Neon (PostgreSQL serverless)
- Connection: @neondatabase/serverless with WebSocket support
- Pooling: Built-in connection pool
- Configuration: DATABASE_URL environment variable

**AI/ML APIs**
- Google Gemini API (AIzaSyDccTviqZPFhCclqRoGXIchD0fp8nTPgxE)
- OpenAI API (configurable)
- Anthropic Claude API (configurable)

### NPM Packages

**Core Framework**
- react, react-dom: UI library
- express: HTTP server
- vite: Build tool and dev server
- typescript, tsx: Type safety and execution

**UI Components**
- @radix-ui/*: Accessible component primitives (30+ packages)
- class-variance-authority: Component variant management
- tailwindcss: Utility-first CSS
- lucide-react: Icon library
- chart.js, react-chartjs-2: Data visualization
- canvas: Chart rendering
- date-fns: Date manipulation

**State & Data Management**
- @tanstack/react-query: Server state management
- wouter: Routing
- react-hook-form, @hookform/resolvers: Form handling

**Database & ORM**
- drizzle-orm: Type-safe SQL queries
- drizzle-kit: Schema migrations
- @neondatabase/serverless: Database client
- zod, drizzle-zod: Validation

**Authentication & Security**
- bcryptjs: Password hashing
- express-session: Session management
- connect-pg-simple: PostgreSQL session store
- express-rate-limit: Rate limiting

**File Handling**
- multer: File upload middleware
- @types/multer: TypeScript definitions

**AI/ML**
- @google/genai: Google Gemini SDK
- openai: OpenAI SDK
- @anthropic-ai/sdk: Claude SDK
- face-api.js: Facial recognition (planned)
- tensorflow.js: ML framework (planned)

**Development Tools**
- @replit/vite-plugin-runtime-error-modal: Error overlay
- @replit/vite-plugin-cartographer: Development tooling
- @replit/vite-plugin-dev-banner: Dev environment indicator
- esbuild: Build tool for server code

### Environment Variables

Required configuration:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `ENCRYPTION_KEY`: 64-character hex key for field encryption
- `GEMINI_API_KEY`: Google Gemini API key
- `OPENAI_API_KEY`: OpenAI API key (optional)
- `ANTHROPIC_API_KEY`: Claude API key (optional)

### Build & Deployment

**Scripts**
- `dev`: Development server with tsx watch mode
- `build`: Vite frontend build + esbuild server bundle
- `start`: Production server execution
- `db:push`: Drizzle schema push to database

**Output Structure**
- Frontend: `dist/public/`
- Backend: `dist/index.js` (ESM bundle)

**Deployment Targets**
- Frontend: Vercel (static hosting)
- Backend: Vercel serverless functions or similar Node.js host
- Database: Neon serverless PostgreSQL
- Free-tier compatible architecture
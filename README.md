# StudyDocs Platform

A full-stack personal document management system for university students. Upload, organize, search, and analyze study materials across semesters and subjects — with multi-provider cloud storage, an interactive knowledge graph, and bilingual support (Vietnamese / English).

## Architecture

```
study-docs-platform/          Turborepo monorepo
├── apps/
│   ├── web/                   Next.js 16 frontend (App Router)
│   └── api/                   NestJS 11 REST API
└── packages/
    ├── ui/                    Shared React component library
    ├── eslint-config/         Shared ESLint presets
    └── typescript-config/     Shared tsconfig bases
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16.1.5, React 19, TypeScript 5.9 |
| **Styling** | Tailwind CSS v4, shadcn/ui (Radix UI), tw-animate-css |
| **Charts** | Recharts 3 |
| **i18n** | next-intl 4 (Vietnamese + English) |
| **Theming** | next-themes (dark / light / system) |
| **Auth** | Supabase Auth (email/password, OAuth) |
| **Database** | PostgreSQL via Supabase |
| **ORM** | Prisma 7 (API), Supabase JS client (Web) |
| **Backend** | NestJS 11, Passport JWT |
| **Storage** | Supabase Storage (<10MB), Google Drive OAuth 2.0 (≥10MB), Cloudinary |
| **AI** | Google Gemini 2.0 Flash (summarization, flashcards, chat) |
| **Monorepo** | Turborepo 2, npm workspaces |

## Database Schema

```
User ──< Subject ──< Document >── DocumentTag >── Tag
```

- **User** — synced with Supabase Auth (`id`, `email`, `name`, `avatar_url`)
- **Subject** — categories with color labels
- **Document** — files with `name`, `file_path` (URL), `file_size`, `file_type` (MIME type), `is_starred`, `is_deleted`
  - **Storage provider detection**: Determined by parsing `file_path` URL:
    - Contains `drive.google.com` → Google Drive
    - Contains `cloudinary.com` → Cloudinary
    - Default → Supabase Storage
- **Tag** / **DocumentTag** — many-to-many tagging

**Note**: There is no `storage_type` column. Provider is detected from the `file_path` URL pattern.

## Features

### Dashboard
- Real-time stat cards (total docs, subjects, storage used, weekly uploads)
- Documents-by-subject bar chart, storage distribution pie chart, upload timeline area chart
- Recent documents widget, study progress by subject, storage quota bars
- Quick upload widget

### Documents & Subjects
- Full CRUD with Supabase real-time queries
- Star/bookmark system, trash with restore
- Subject detail pages with document listing

### Semesters
- Organize subjects into academic year / semester groups
- Nested routing: `/semesters` → `/semesters/[id]`

### Search
- Full-text search via Supabase `ilike` queries
- Filter by subject and file type (PDF, DOCX, PPTX, images)
- Dynamic filter badges from real data

### Insights
- Subject analysis: documents-per-subject breakdown
- Storage distribution across providers
- Study progress metrics

### Knowledge Graph
- Interactive SVG visualization
- Nodes: subjects (circle layout), documents (orbital), tags (bottom row)
- Click-to-select with connection highlighting
- Zoom controls, type filtering

### Study Planner
- Study progress tracker by subject
- Spaced-repetition review reminders (based on document `updated_at`)
- Weekly activity timeline

### Storage
- Multi-provider dashboard (Supabase, Google Drive, Cloudinary)
- Smart routing: files <10MB → Supabase, ≥10MB → Google Drive (OAuth 2.0)
- Per-provider quota tracking and progress bars
- Large file detection (>5 MB suggestions for migration)

### AI-Powered Study Tools
- **Document Summarization**: Google Gemini 2.0 Flash for concise summaries
- **Flashcard Generation**: Auto-create study flashcards from documents
- **Interactive Chat**: Q&A with documents using AI
- **Quota Management**: User-friendly error messages for rate limits (429) and API issues

### Security
- Account info from Supabase Auth (provider, email confirmation status)
- Security score visualization
- Actionable recommendations (2FA, recovery email, password rotation)

### Internationalization
- Vietnamese (`vi`) and English (`en`)
- Locale-aware navigation via `next-intl/navigation`
- Persistent locale switching (no reset on route change)

### Dark / Light Mode
- System preference detection with manual toggle
- Dark: navy palette (`#121629` background, `#01FF80` primary accent)
- Light: white palette (`#ffffff` background, `#01CC66` primary accent)
- Themed sidebar, cards, charts, and all components

## 🔄 Storage Routing Logic

The platform intelligently routes file uploads based on size:

```
┌─────────────────────────────────────────┐
│         User Uploads File               │
└─────────────┬───────────────────────────┘
              │
              ▼
       ┌──────────────┐
       │ Size Check   │
       └──────┬───────┘
              │
       ┌──────┴──────┐
       │             │
  < 10MB         ≥ 10MB
       │             │
       ▼             ▼
┌──────────────┐  ┌──────────────────────┐
│   Supabase   │  │  Backend API         │
│   Storage    │  │  POST /storage/upload│
│   (Direct)   │  │  → Google Drive      │
└──────────────┘  └──────────────────────┘
```

**Frontend Logic** (`subjects/[id]/page.tsx`):
- Check file size: `file.size >= 10 * 1024 * 1024` (10MB)
- Small files: Direct upload to Supabase Storage
- Large files: `POST /storage/upload` → Backend → Google Drive (OAuth 2.0)

**Storage Provider Detection**:
Files are identified by parsing the `file_path` URL:
- Contains `drive.google.com` → Google Drive
- Contains `cloudinary.com` → Cloudinary  
- Default → Supabase Storage

## 🤖 AI Integration (Google Gemini)

The platform uses **Google Gemini 2.0 Flash** for AI-powered study tools.

### Available Features
- **Summarization**: Extract key points from documents
- **Flashcard Generation**: Create Q&A pairs for studying
- **Interactive Chat**: Q&A with document context

### Rate Limits (Free Tier)
- 15 requests per minute (RPM)
- 1,500 requests per day (RPD)
- 1,000,000 tokens per minute (TPM)

### Error Handling
- **429 Quota Exceeded**: "AI quota exceeded. Please try again in a minute."
- **404 Model Unavailable**: "AI model temporarily unavailable"
- **500 Internal Error**: Detailed error logging + user-friendly message

**API Endpoints**:
- `POST /ai/summarize` - Generate document summary
- `POST /ai/flashcards` - Create flashcards from document
- `POST /ai/chat` - Interactive Q&A with document

## 🔐 Google Drive OAuth 2.0 Setup

For large file storage (≥10MB), configure Google Drive OAuth 2.0:

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable **Google Drive API**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google Drive API"
   - Click "Enable"

### 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Add authorized redirect URI:
   ```
   http://localhost:3001/auth/google/callback
   ```
   (For production, use your domain)
5. Save the **Client ID** and **Client Secret**

### 3. Get OAuth Refresh Token

1. Update `apps/api/.env`:
   ```env
   GOOGLE_OAUTH_CLIENT_ID="your-client-id"
   GOOGLE_OAUTH_CLIENT_SECRET="your-client-secret"
   ```

2. Start API server: `cd apps/api && npm run start:dev`

3. Open browser: `http://localhost:3001/storage/oauth/url`

4. Copy the authorization URL and open it

5. Grant permissions to your Google account

6. After redirect, copy the **refresh token** from the page

7. Update `.env`:
   ```env
   GOOGLE_OAUTH_REFRESH_TOKEN="1//0eIQiZPlesJL3..."
   ```

8. Create a folder in Google Drive, get its ID from URL:
   ```
   https://drive.google.com/drive/folders/[FOLDER_ID]
   ```

9. Update `.env`:
   ```env
   GOOGLE_DRIVE_FOLDER_ID="your-folder-id"
   ```

10. Restart the API server

**Verification**: Check logs for `"Google Drive initialized with OAuth 2.0"`

## 🐛 Troubleshooting

### API Returns 500 on AI Endpoints

**Cause**: Gemini API key invalid or quota exceeded

**Solution**:
- Check `GEMINI_API_KEY` in `apps/api/.env`
- Verify API key at [Google AI Studio](https://makersuite.google.com/app/apikey)
- Wait for quota reset if seeing 429 errors

### Files Not Uploading to Google Drive

**Cause**: OAuth refresh token expired or invalid

**Solution**:
- Re-run OAuth flow: `http://localhost:3001/storage/oauth/url`
- Get new refresh token
- Update `GOOGLE_OAUTH_REFRESH_TOKEN` in `.env`
- Restart API server

### Storage Dashboard Shows Incorrect Provider

**Cause**: `file_path` URL pattern not recognized

**Solution**:
- Verify `file_path` contains full URL (not just filename)
- Check URL includes `drive.google.com` for Google Drive files
- Review `fetchStorageStats()` logic in `lib/api.ts`

### Database Connection Errors

**Cause**: Invalid `DATABASE_URL` or Supabase project paused

**Solution**:
- Check `DATABASE_URL` format in `.env`
- Unpause project in Supabase dashboard
- Run `npx prisma db push` to sync schema

### Frontend Can't Connect to Backend

**Cause**: CORS misconfiguration or wrong API URL

**Solution**:
- Verify `NEXT_PUBLIC_API_URL` in `.env.local` (should be `http://localhost:3001`)
- Check backend CORS settings in `apps/api/src/main.ts`
- Ensure API server is running on port 3001 (check logs)

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- Supabase project (with Auth + Storage + PostgreSQL)
- (Optional) Google Cloud service account for Drive storage
- (Optional) Cloudinary account

### Environment Variables

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Create `apps/api/.env`:

```env
# Database
DATABASE_URL=postgresql://postgres:[password]@[host]/[database]

# Supabase (Auth & Storage)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_STORAGE_BUCKET=documents

# Google Drive OAuth 2.0 (for files ≥10MB)
GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-your-secret
GOOGLE_OAUTH_REFRESH_TOKEN=1//0eYourRefreshToken...
GOOGLE_DRIVE_FOLDER_ID=your-drive-folder-id

# Google Gemini AI
GEMINI_API_KEY=AIzaSy...your-gemini-api-key

# JWT (optional)
JWT_SECRET=your-jwt-secret

# Server
PORT=3001
```

### Installation

```bash
# Clone and install
git clone <repo-url>
cd study-docs-platform
npm install

# Push database schema
cd apps/api
npx prisma db push
cd ../..
```

### Development

```bash
# Start all apps (web on :3000, api on :3001)
npm run dev

# Or start individually
cd apps/web && npm run dev
cd apps/api && npm run start:dev
```

**Port Configuration**:
- Frontend (Next.js): http://localhost:3000
- Backend (NestJS): http://localhost:3001

### Build

```bash
npm run build          # Build all apps via Turborepo
npm run lint           # Lint all apps
npm run check-types    # Type-check all apps
```

## Project Structure (Web App)

```
apps/web/
├── app/
│   ├── globals.css              Theme variables + utility classes
│   └── [locale]/
│       ├── layout.tsx           Root locale layout (ThemeProvider + next-intl)
│       ├── (auth)/              Login / Register pages
│       └── (dashboard)/
│           ├── layout.tsx       Auth guard + Sidebar + Header
│           ├── dashboard/       Main dashboard
│           ├── documents/       Document management
│           ├── semesters/       Semester management
│           ├── subjects/[id]/   Subject detail
│           ├── starred/         Bookmarked documents
│           ├── trash/           Soft-deleted documents
│           ├── search/          Full-text search
│           ├── insights/        Analytics
│           ├── knowledge-graph/ Interactive graph
│           ├── planner/         Study planner
│           ├── storage/         Storage dashboard
│           ├── security/        Security settings
│           └── ai-tools/        AI tools (placeholder)
├── components/                  Shared components (ThemeToggle, Logo, etc.)
│   └── ui/                      shadcn/ui components
├── lib/
│   ├── api.ts                   Supabase query functions (15+ queries)
│   ├── hooks.ts                 React hooks (useSubjects, useDashboardStats, etc.)
│   ├── utils.ts                 Utilities (cn, formatFileSize, formatDate, etc.)
│   └── supabase/                Supabase client/server helpers
├── i18n/
│   ├── routing.ts               Locale routing config
│   ├── navigation.ts            Locale-aware Link/useRouter/usePathname
│   └── request.ts               Server-side locale resolver
└── messages/
    ├── en.json                  English translations
    └── vi.json                  Vietnamese translations
```

## Color Palette

| Token | Dark | Light |
|-------|------|-------|
| Background | `#121629` | `#ffffff` |
| Card | `#161a33` | `#ffffff` |
| Primary | `#01FF80` | `#01CC66` |
| Border | `#1e2140` | `#e4e4e7` |
| Sidebar | `#121629` | `#fafafa` |
| Muted | `#161a30` | `#f4f4f5` |

## License

Private — all rights reserved.

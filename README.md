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
| **Storage** | Supabase Storage, Google Drive API, Cloudinary |
| **Monorepo** | Turborepo 2, npm workspaces |

## Database Schema

```
User ──< Subject ──< Document >── DocumentTag >── Tag
```

- **User** — synced with Supabase Auth (`id`, `email`, `name`, `avatar_url`)
- **Subject** — categories with color labels
- **Document** — files with `storage_type` (SUPABASE / GDRIVE / CLOUDINARY), `file_url`, `file_size`, `mime_type`
- **Tag** / **DocumentTag** — many-to-many tagging

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
- Per-provider quota tracking and progress bars
- Large file detection (>5 MB)

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
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret

# Optional: Google Drive
GDRIVE_SERVICE_ACCOUNT_EMAIL=...
GDRIVE_PRIVATE_KEY=...
GDRIVE_FOLDER_ID=...
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
# Start all apps (web on :3000, api on :4000)
npm run dev

# Or start individually
cd apps/web && npm run dev
cd apps/api && npm run start:dev
```

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

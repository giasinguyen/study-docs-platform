# Study Docs Platform - Web App

Frontend application của Study Docs Platform - Nền tảng quản lý tài liệu học tập thông minh.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** Radix UI + Custom components
- **i18n:** next-intl (Hỗ trợ EN/VI)
- **Theme:** next-themes (Dark/Light mode)
- **Auth:** Supabase Auth
- **Database:** Supabase (PostgreSQL)
- **Monorepo:** Turborepo

## Getting Started

### Development

```bash
# Từ thư mục root của monorepo
cd study-docs-platform
npm install

# Chạy dev server (port 3000)
npm run dev
```

Hoặc chạy riêng web app:

```bash
cd apps/web
npm run dev
```

App sẽ chạy tại [http://localhost:3000](http://localhost:3000)

### Environment Variables

Tạo file `.env.local` trong `apps/web/`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=your-api-url
```

## Scripts

```bash
npm run dev          # Chạy development server
npm run build        # Build production
npm start            # Start production server
npm run lint         # Chạy ESLint
npm run check-types  # Type checking với TypeScript
```

## Project Structure

```
apps/web/
├── app/                    # Next.js App Router
│   ├── [locale]/          # i18n routing
│   │   ├── (dashboard)/   # Dashboard routes (protected)
│   │   └── (auth)/        # Auth routes (public)
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── theme-provider.tsx
│   └── ...
├── lib/                   # Utilities & hooks
│   ├── api.ts            # API client
│   ├── hooks.ts          # Custom hooks
│   ├── utils.ts          # Utility functions
│   └── supabase/         # Supabase config
├── messages/             # i18n translations
│   ├── en.json
│   └── vi.json
└── i18n/                 # i18n configuration
```

## Features

- ✅ **Multi-language:** Tiếng Việt & English
- ✅ **Dark/Light Mode:** Theme switching
- ✅ **Authentication:** Supabase Auth (Email + Social)
- ✅ **Dashboard:** Document management
- ✅ **Responsive:** Mobile-first design
- ✅ **File Upload:** Drag & drop support
- 🚧 **AI Features:** Coming soon
- 🚧 **Analytics:** Coming soon

## Deploy on Vercel

**Xem hướng dẫn chi tiết tại:**
- [VERCEL_CHECKLIST.md](../../VERCEL_CHECKLIST.md) - Quick checklist
- [DEPLOY.md](../../DEPLOY.md) - Full deployment guide

**Quick Deploy:**

1. Push code lên Git repository
2. Import vào Vercel Dashboard
3. Chọn Root Directory: `apps/web`
4. Thêm environment variables
5. Deploy!

Vercel sẽ tự động detect Next.js và setup CI/CD.

## Development Notes

### TypeScript & Linting

Hiện tại `next.config.js` đã disable strict type checking và linting trong build:

```js
typescript: {
  ignoreBuildErrors: true,  // Tạm thời để deploy nhanh
},
eslint: {
  ignoreDuringBuilds: true, // Tạm thời để deploy nhanh
},
```

**TODO:** Fix type errors và enable lại sau khi deploy thành công.

### Monorepo Support

App này sử dụng shared packages từ monorepo:
- `@repo/ui` - Shared UI components
- `@repo/typescript-config` - Shared TS config
- `@repo/eslint-config` - Shared ESLint config

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Turborepo Handbook](https://turbo.build/repo/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://radix-ui.com/)

## Contributing

1. Tạo feature branch từ `main`
2. Commit changes (follow conventional commits)
3. Push và tạo Pull Request
4. PR sẽ tự động tạo preview deployment trên Vercel

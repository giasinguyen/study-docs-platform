# Deploy Web App to Vercel

## Hướng dẫn Deploy

### 1. Chuẩn bị

Đảm bảo bạn đã có:
- Tài khoản Vercel (đăng ký tại [vercel.com](https://vercel.com))
- Repository GitHub/GitLab/Bitbucket đã push code
- Các biến môi trường cần thiết

### 2. Deploy từ Vercel Dashboard

#### Bước 1: Import Project
1. Đăng nhập vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import repository của bạn
4. Vercel sẽ tự động phát hiện monorepo

#### Bước 2: Cấu hình Project
Vercel sẽ tự động sử dụng cấu hình từ `vercel.json`, nhưng bạn có thể kiểm tra:

- **Framework Preset:** Next.js
- **Root Directory:** `.` (root của monorepo, KHÔNG chọn `apps/web`)
- **Build Command:** `npx turbo run build --filter=web`
- **Output Directory:** `apps/web/.next`
- **Install Command:** `npm install`

#### Bước 3: Cấu hình Environment Variables
Trong Vercel Dashboard, thêm các biến môi trường:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=your-api-url
```

**Lưu ý:** Các biến có prefix `NEXT_PUBLIC_` sẽ được expose ra client-side.

#### Bước 4: Deploy
1. Click "Deploy"
2. Đợi quá trình build hoàn tất
3. Vercel sẽ cung cấp URL production

### 3. Deploy bằng Vercel CLI (Alternative)

```bash
# Cài đặt Vercel CLI
npm i -g vercel

# Từ thư mục root của monorepo
cd study-docs-platform

# Login vào Vercel
vercel login

# Deploy (lần đầu)
vercel

# Deploy production
vercel --prod
```

### 4. Cấu hình Custom Domain (Optional)

1. Trong Vercel Dashboard → Project Settings → Domains
2. Thêm custom domain của bạn
3. Cấu hình DNS theo hướng dẫn của Vercel

### 5. Continuous Deployment

Vercel tự động setup CI/CD:
- **Production Branch:** `main` hoặc `master`
- **Preview Deployments:** Mọi pull request sẽ tự động tạo preview deployment
- **Auto Deploy:** Mỗi khi push code, Vercel tự động deploy

### 6. Kiểm tra sau khi Deploy

- ✅ Trang chủ load được
- ✅ i18n (đa ngôn ngữ) hoạt động
- ✅ Theme toggle (dark/light mode) hoạt động
- ✅ API calls đến backend thành công
- ✅ Supabase authentication hoạt động

### 7. Troubleshooting

#### Build fails với monorepo
- Đảm bảo `vercel.json` ở đúng vị trí (root của monorepo)
- Kiểm tra Root Directory setting trong Vercel Dashboard

#### Environment variables không hoạt động
- Đảm bảo đã thêm đúng tên biến
- Redeploy sau khi thêm biến môi trường mới

#### Module not found errors
- Kiểm tra `transpilePackages` trong `next.config.js`
- Đảm bảo workspace dependencies được cấu hình đúng

### 8. Performance Tips

- Enable Edge Runtime cho tốc độ tối ưu
- Sử dụng Next.js Image Optimization
- Enable ISR (Incremental Static Regeneration) nếu phù hợp
- Cấu hình caching headers

### 9. Monitoring

Vercel cung cấp:
- **Analytics:** Traffic và performance metrics
- **Logs:** Real-time deployment và runtime logs
- **Speed Insights:** Core Web Vitals monitoring

## Liên kết hữu ích

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Turborepo with Vercel](https://turbo.build/repo/docs/handbook/deploying-with-docker)

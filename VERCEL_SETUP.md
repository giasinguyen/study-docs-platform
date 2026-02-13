# Vercel Environment Variables Setup

## Required Environment Variables

Your Vercel deployment needs the following environment variables to work properly:

### 1. Supabase Configuration (Required)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://wmwctcqoktkfkztprira.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Where to get these:**
1. Go to your Supabase project dashboard
2. Click on "Settings" → "API"
3. Copy the "Project URL" for `NEXT_PUBLIC_SUPABASE_URL`
4. Copy the "anon public" key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Optional: Backend API URL

```bash
NEXT_PUBLIC_API_URL=https://your-backend-api.vercel.app
```

This is only needed if you want to use the separate NestJS backend for file uploads and AI features.

## How to Add Environment Variables to Vercel

### Method 1: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your project (`study-docs-platform-web`)
3. Click on **Settings** tab
4. Click on **Environment Variables** in the left sidebar
5. Add each variable:
   - **Key**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: Your Supabase URL
   - **Environments**: Select all (Production, Preview, Development)
   - Click **Save**
6. Repeat for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
7. Click **Redeploy** to apply the changes

### Method 2: Via Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Navigate to your project
cd study-docs-platform

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste your URL when prompted

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste your key when prompted

# Redeploy
vercel --prod
```

## After Adding Variables

1. **Redeploy your application**: Vercel will automatically redeploy when you add new environment variables
2. **Wait 1-2 minutes** for the deployment to complete
3. **Visit your site**: The error should be gone and you should see the app working

## Troubleshooting

### Still getting 500 error?
- Check Vercel's **Deployments** tab for build logs
- Verify environment variables are set for **Production** environment
- Make sure to redeploy after adding variables

### Can't find Supabase keys?
- You can find the `.env.example` file in the project root
- The Supabase project URL is already provided: `https://wmwctcqoktkfkztprira.supabase.co`
- You need to get the anon key from your Supabase dashboard

## Next Steps

After the frontend is working:
1. Deploy the backend API (`apps/api`) if needed for file uploads
2. Configure Google Drive integration for document storage
3. Add OpenAI API key for AI features

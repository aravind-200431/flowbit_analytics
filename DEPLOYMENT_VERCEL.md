# Vercel Deployment Guide

## 🎯 Recommended Approach: Separate Deployments

For a monorepo, deploy the frontend and backend as **separate Vercel projects**:

### Step 1: Deploy Frontend (Next.js)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm install && npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

5. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_BASE=https://your-api-project.vercel.app/api
   NEXT_PUBLIC_APP_URL=https://your-web-project.vercel.app
   DATABASE_URL=postgresql://neondb_owner:npg_UY0kiEc4rsPL@ep-calm-sea-a1kkm463-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```

6. Click **"Deploy"**

7. Copy the deployment URL (e.g., `https://your-web-project.vercel.app`)

### Step 2: Deploy Backend API

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import the **same** GitHub repository
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `apps/api`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: Leave empty (not needed for serverless)
   - **Install Command**: `npm install`

5. Add Environment Variables:
   ```
   DATABASE_URL=postgresql://neondb_owner:npg_UY0kiEc4rsPL@ep-calm-sea-a1kkm463-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   VANNA_API_BASE_URL=https://your-vanna.onrender.com
   PORT=3001
   NODE_ENV=production
   ```

6. Click **"Deploy"**

7. Copy the deployment URL (e.g., `https://your-api-project.vercel.app`)

### Step 3: Update Frontend Environment Variables

1. Go back to your **Frontend project** in Vercel
2. Go to **Settings** > **Environment Variables**
3. Update `NEXT_PUBLIC_API_BASE` with your actual API URL:
   ```
   NEXT_PUBLIC_API_BASE=https://your-api-project.vercel.app/api
   ```
4. **Redeploy** the frontend

## 🔧 Alternative: Single Deployment (Advanced)

If you want to deploy both in one project, you need to:

1. Convert API routes to Next.js API routes in `apps/web/src/app/api/`
2. Or use Vercel's rewrites to proxy API requests

This is more complex and not recommended for monorepos.

## ✅ Verification

After deployment:

1. **Frontend**: Visit `https://your-web-project.vercel.app`
2. **API Health**: Visit `https://your-api-project.vercel.app/health`
3. **API Stats**: Visit `https://your-api-project.vercel.app/api/stats`

## 🐛 Troubleshooting

### Build Fails

- Check that `Root Directory` is set correctly
- Ensure all dependencies are in `package.json`
- Check build logs in Vercel dashboard

### API Not Working

- Verify environment variables are set
- Check that `DATABASE_URL` is correct
- Ensure Prisma client is generated (add `npm run db:generate` to build command if needed)

### CORS Issues

- Update CORS in `apps/api/src/index.ts` to allow your frontend domain
- Or set `allow_origins: ["*"]` for development

## 📝 Environment Variables Checklist

### Frontend Project
- [ ] `NEXT_PUBLIC_API_BASE`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `DATABASE_URL` (if needed for any server-side operations)

### Backend Project
- [ ] `DATABASE_URL`
- [ ] `VANNA_API_BASE_URL`
- [ ] `PORT` (optional, Vercel sets this automatically)
- [ ] `NODE_ENV=production`


# Vercel Deployment Fix

## ✅ Solution: Deploy Frontend and Backend Separately

The issue is that Vercel's deprecated `builds` configuration doesn't work well with monorepos. **Deploy them as separate projects**.

## 🚀 Step-by-Step Deployment

### Step 1: Deploy Backend API (First)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. **Configure Project Settings:**
   - **Framework Preset**: `Other`
   - **Root Directory**: `apps/api` ⚠️ **IMPORTANT**
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

5. **Add Environment Variables:**
   ```
   DATABASE_URL=postgresql://neondb_owner:npg_UY0kiEc4rsPL@ep-calm-sea-a1kkm463-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   VANNA_API_BASE_URL=https://your-vanna.onrender.com
   NODE_ENV=production
   ```

6. Click **"Deploy"**

7. **Wait for deployment** and copy the URL (e.g., `https://your-api-project.vercel.app`)

### Step 2: Deploy Frontend (Second)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"** (create a NEW project)
3. Import the **same** GitHub repository
4. **Configure Project Settings:**
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `apps/web` ⚠️ **IMPORTANT**
   - **Build Command**: `npm install && npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

5. **Add Environment Variables:**
   ```
   NEXT_PUBLIC_API_BASE=https://your-api-project.vercel.app/api
   NEXT_PUBLIC_APP_URL=https://your-web-project.vercel.app
   ```

6. Click **"Deploy"**

7. **Wait for deployment** and copy the URL (e.g., `https://your-web-project.vercel.app`)

### Step 3: Update Frontend Environment Variables

1. Go back to your **Frontend project** in Vercel
2. Go to **Settings** > **Environment Variables**
3. Update `NEXT_PUBLIC_API_BASE` with your actual API URL:
   ```
   NEXT_PUBLIC_API_BASE=https://your-api-project.vercel.app/api
   ```
4. Go to **Deployments** tab
5. Click **"Redeploy"** on the latest deployment

## ✅ Verification

After deployment:

1. **Backend Health**: `https://your-api-project.vercel.app/health`
2. **Backend API**: `https://your-api-project.vercel.app/api/stats`
3. **Frontend**: `https://your-web-project.vercel.app`

## 🔧 What Was Fixed

1. ✅ Removed deprecated `builds` configuration
2. ✅ Updated `vercel.json` files to use modern configuration
3. ✅ Added `vercel-build` script to generate Prisma client
4. ✅ Configured proper serverless function entry point

## 📝 Important Notes

- **Root Directory** must be set correctly in Vercel project settings
- Deploy backend first, then frontend
- Update frontend environment variables after backend deployment
- Both projects use the same GitHub repository but different root directories

## 🐛 If Deployment Still Fails

1. Check **Build Logs** in Vercel dashboard
2. Ensure **Root Directory** is set correctly
3. Verify all environment variables are set
4. Check that Prisma client is generated (should happen in build command)


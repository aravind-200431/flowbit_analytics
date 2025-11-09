# Render Deployment Fix for Vanna AI

## 🔧 Problem
The deployment was failing because some Python packages were trying to build from source and required Rust, which wasn't properly configured in Render's build environment.

## ✅ Solution Applied

1. **Updated `requirements.txt`** with newer versions that have pre-built wheels
2. **Added `render.yaml`** for proper build configuration
3. **Added Python version files** to ensure consistent builds

## 🚀 Deployment Steps on Render

### Option 1: Using Render Dashboard (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** > **"Web Service"**
3. Connect your GitHub repository
4. **Configure Service:**
   - **Name**: `flowbit-vanna-ai`
   - **Environment**: `Python 3`
   - **Root Directory**: `services/vanna`
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

5. **Add Environment Variables:**
   ```
   DATABASE_URL=postgresql+psycopg://neondb_owner:npg_UY0kiEc4rsPL@ep-calm-sea-a1kkm463-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   GROQ_API_KEY=your_groq_api_key_here
   PORT=8000
   ```

6. Click **"Create Web Service"**

### Option 2: Using render.yaml (Auto-deploy)

If you've added `render.yaml` to your repo, Render will auto-detect it:

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** > **"Blueprint"**
3. Connect your GitHub repository
4. Render will detect `render.yaml` and create the service automatically
5. Add environment variables in the dashboard

## 🔍 Alternative: If Still Failing

If you still get Rust/Cargo errors, try this alternative `requirements.txt`:

```txt
fastapi==0.115.0
uvicorn[standard]==0.32.0
pydantic==2.9.0
psycopg2-binary==2.9.10
python-dotenv==1.0.1
groq==0.11.0
sqlalchemy==2.0.36
```

Or use `psycopg` (newer, pure Python) instead of `psycopg2-binary`:

```txt
fastapi==0.115.0
uvicorn[standard]==0.32.0
pydantic==2.9.0
psycopg[binary]==3.2.0
python-dotenv==1.0.1
groq==0.11.0
sqlalchemy==2.0.36
```

If using `psycopg`, update `main.py`:
```python
import psycopg
from psycopg.rows import dict_row
```

## ✅ Verification

After deployment:

1. **Health Check**: `https://your-service.onrender.com/health`
2. Should return: `{"status": "ok"}`

## 🐛 Troubleshooting

### Build Still Failing

1. Check **Build Logs** in Render dashboard
2. Ensure Python version is 3.11 or 3.12
3. Try using `psycopg` instead of `psycopg2-binary`
4. Check that all environment variables are set

### Runtime Errors

1. Check **Runtime Logs** in Render dashboard
2. Verify `DATABASE_URL` format (should use `postgresql+psycopg://`)
3. Verify `GROQ_API_KEY` is set correctly


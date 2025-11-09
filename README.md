# Flowbit Analytics Dashboard

A production-grade full-stack web application with an Interactive Analytics Dashboard and "Chat with Data" interface powered by Vanna AI.

## 🏗️ Project Structure

```
.
├── apps/
│   ├── web/          # Next.js frontend (App Router)
│   └── api/          # Express.js backend API
├── services/
│   └── vanna/        # Python FastAPI service for Vanna AI
├── data/
│   └── Analytics_Test_Data.json
└── package.json
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- PostgreSQL 14+
- Docker (optional, for local PostgreSQL)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

#### Option A: Local PostgreSQL

1. Create a PostgreSQL database:
```bash
createdb flowbit_analytics
```

2. Update `.env` in `apps/api/`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/flowbit_analytics"
```

#### Option B: Docker Compose

```bash
docker-compose up -d
```

### 3. Initialize Database Schema

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Set Up Environment Variables

#### Frontend (`apps/web/.env.local`)
```
NEXT_PUBLIC_API_BASE=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Backend (`apps/api/.env`)
```
DATABASE_URL=postgresql://user:password@localhost:5432/flowbit_analytics
VANNA_API_BASE_URL=http://localhost:8000
PORT=3001
NODE_ENV=development
```

#### Vanna AI (`services/vanna/.env`)
```
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/flowbit_analytics
GROQ_API_KEY=your_groq_api_key_here
PORT=8000
```

### 5. Start Development Servers

```bash
# Start all services
npm run dev

# Or start individually:
# Terminal 1: Frontend
cd apps/web && npm run dev

# Terminal 2: Backend
cd apps/api && npm run dev

# Terminal 3: Vanna AI
cd services/vanna && python -m uvicorn main:app --reload --port 8000
```

## 📊 Database Schema

The database consists of the following main tables:

- **documents** - Document metadata and file information
- **invoices** - Invoice header information
- **vendors** - Vendor details
- **customers** - Customer information
- **line_items** - Invoice line items
- **payments** - Payment terms and due dates

See `apps/api/prisma/schema.prisma` for the complete schema.

## 🔌 API Endpoints

### Dashboard APIs

- `GET /api/stats` - Overview statistics (total spend, invoices, documents, avg invoice value)
- `GET /api/invoice-trends` - Monthly invoice volume and value trends
- `GET /api/vendors/top10` - Top 10 vendors by spend
- `GET /api/category-spend` - Spend grouped by category
- `GET /api/cash-outflow` - Expected cash outflow forecast
- `GET /api/invoices` - List of invoices with pagination, search, and filters

### Chat API

- `POST /api/chat-with-data` - Natural language query to Vanna AI

## 🤖 Vanna AI Setup

The Vanna AI service is a Python FastAPI application that:

1. Connects to PostgreSQL
2. Uses Groq for SQL generation
3. Executes queries and returns results

### Setup Vanna AI

```bash
cd services/vanna
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Get your Groq API key from https://console.groq.com/

## 📝 Documentation

- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Chat with Data Workflow](./docs/CHAT_WORKFLOW.md)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific app tests
cd apps/web && npm test
cd apps/api && npm test
```

## 🚢 Deployment

### Quick Deployment Guide

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

### Frontend & Backend (Vercel)

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Configure environment variables (see DEPLOYMENT.md)
4. Deploy

**Required Environment Variables:**
```
NEXT_PUBLIC_API_BASE=https://your-api.vercel.app/api
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
DATABASE_URL=postgresql://user:pass@host:5432/dbname
VANNA_API_BASE_URL=https://your-vanna.onrender.com
```

### Vanna AI (Render/Railway/Fly.io)

1. Create a new service on Render/Railway/Fly.io
2. Connect GitHub repository
3. Set root directory to `services/vanna`
4. Configure build command: `pip install -r requirements.txt`
5. Configure start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Set environment variables (see DEPLOYMENT.md)
7. Deploy

**Required Environment Variables:**
```
DATABASE_URL=postgresql+psycopg://user:pass@host:5432/dbname
GROQ_API_KEY=your_groq_api_key_here
PORT=8000
```

### PostgreSQL Database

Set up a PostgreSQL database on:
- **Supabase** (recommended, free tier)
- **Neon** (serverless PostgreSQL)
- **Railway** (easy setup)

Then run migrations:
```bash
npm run db:generate
cd apps/api && npx prisma db push
npm run db:seed
```

## 📄 License

MIT


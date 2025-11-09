#!/bin/bash

# Flowbit Analytics Dashboard Setup Script

set -e

echo "🚀 Setting up Flowbit Analytics Dashboard..."
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9+ first."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. You'll need to set up PostgreSQL manually."
else
    echo "✅ Docker found"
fi

echo "✅ Prerequisites check complete"
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd apps/api
npm install
cd ../..
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd apps/web
npm install
cd ../..
echo ""

# Check for data file
echo "📄 Checking for data file..."
if [ ! -f "data/Analytics_Test_Data.json" ]; then
    echo "⚠️  Warning: data/Analytics_Test_Data.json not found"
    echo "   Please copy your Analytics_Test_Data.json file to the data/ directory"
else
    echo "✅ Data file found"
fi
echo ""

# Setup instructions
echo "📝 Next steps:"
echo ""
echo "1. Set up PostgreSQL:"
echo "   Option A: docker-compose up -d"
echo "   Option B: Create database manually: createdb flowbit_analytics"
echo ""
echo "2. Configure environment variables:"
echo "   - Copy apps/api/.env.example to apps/api/.env and update DATABASE_URL"
echo "   - Copy apps/web/.env.local.example to apps/web/.env.local"
echo "   - Copy services/vanna/.env.example to services/vanna/.env and add GROQ_API_KEY"
echo ""
echo "3. Initialize database:"
echo "   npm run db:generate"
echo "   npm run db:migrate"
echo "   npm run db:seed"
echo ""
echo "4. Set up Vanna AI service:"
echo "   cd services/vanna"
echo "   python -m venv venv"
echo "   source venv/bin/activate  # On Windows: venv\\Scripts\\activate"
echo "   pip install -r requirements.txt"
echo ""
echo "5. Start services:"
echo "   Terminal 1: cd apps/api && npm run dev"
echo "   Terminal 2: cd apps/web && npm run dev"
echo "   Terminal 3: cd services/vanna && python main.py"
echo ""
echo "6. Open http://localhost:3000"
echo ""
echo "✅ Setup script complete!"
echo ""
echo "For detailed instructions, see SETUP.md"


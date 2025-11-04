#!/bin/bash

# Render Deployment Test Script
echo "🧪 Testing backend for Render deployment..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found"
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install failed"
    exit 1
fi

echo "✅ Dependencies installed"

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please update .env with your production values"
fi

# Test if the app can start (basic syntax check)
echo "🔍 Checking application syntax..."
node -c src/index.js

if [ $? -ne 0 ]; then
    echo "❌ Syntax error in application"
    exit 1
fi

echo "✅ Application syntax is valid"

# Check if required environment variables are set
echo "🔧 Checking environment variables..."
REQUIRED_VARS=("MONGODB_URI" "JWT_SECRET" "JWT_REFRESH_SECRET")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "⚠️  Missing environment variables: ${MISSING_VARS[*]}"
    echo "   These should be set in Render dashboard"
fi

echo "🎉 Pre-deployment checks completed!"
echo ""
echo "Next steps:"
echo "1. Commit and push your changes to GitHub"
echo "2. Go to https://render.com and create a new Web Service"
echo "3. Connect your GitHub repository"
echo "4. Set Root Directory to: backend/"
echo "5. Set environment variables in Render dashboard"
echo "6. Deploy!"
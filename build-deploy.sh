#!/bin/bash

# Build script for GitHub Pages deployment
# This builds the frontend and prepares it for deployment

echo "🔨 Building Judges Court for GitHub Pages..."
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Build the project
echo "🚀 Building production bundle..."
npm run build

cd ..

echo "✅ Build complete! Files ready in /docs folder."
echo "📝 Commit and push to deploy: git add docs && git commit -m 'Deploy to GitHub Pages' && git push"

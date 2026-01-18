#!/bin/bash
# Netlify build script to prevent yarn workspace detection
set -e

echo "=== Netlify Build Script ==="
echo "Removing backend to prevent workspace detection..."
rm -rf backend

echo "Replacing package.json with Netlify version (no workspaces)..."
if [ -f package.json ]; then
  cp package.json package.json.original
  cp package.netlify.json package.json
fi

echo "Building frontend..."
cd frontend
npm install
npm run build

echo "=== Build Complete ==="


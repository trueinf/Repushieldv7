#!/bin/bash
# Netlify build script to prevent yarn workspace detection
set -e

echo "=== Netlify Build Script ==="
echo "Step 1: Removing backend directory..."
rm -rf backend

echo "Step 2: Replacing package.json to prevent workspace detection..."
if [ -f package.json ]; then
  cp package.json package.json.original
  # Remove workspaces field using node
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    delete pkg.workspaces;
    pkg.scripts = { build: 'cd frontend && npm install && npm run build' };
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
  "
fi

echo "Step 3: Building frontend..."
cd frontend
npm install
npm run build

echo "=== Build Complete ==="


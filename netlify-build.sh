#!/bin/bash
# Netlify build script - prevents workspace detection
set -e

echo "=== Netlify Build Script ==="
echo "Step 1: Removing backend to prevent workspace detection..."
rm -rf backend

echo "Step 2: Modifying root package.json to remove workspaces..."
if [ -f package.json ]; then
  cp package.json package.json.backup
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    delete pkg.workspaces;
    pkg.scripts = {};
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
  "
fi

echo "Step 3: Installing and building frontend..."
cd frontend
npm install --legacy-peer-deps
npm run build

echo "=== Build Complete ==="


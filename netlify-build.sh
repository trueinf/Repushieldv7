#!/bin/bash
# Netlify build script to prevent yarn workspace detection
set -e

# Remove backend to prevent workspace detection
echo "Removing backend directory to prevent yarn workspace detection..."
rm -rf backend

# Remove root package.json workspaces temporarily
echo "Temporarily disabling workspaces in root package.json..."
if [ -f package.json ]; then
  # Create backup
  cp package.json package.json.backup
  # Remove workspaces field using node or sed
  node -e "const pkg = require('./package.json'); delete pkg.workspaces; require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));"
fi

# Now run the frontend build
cd frontend
npm install
npm run build


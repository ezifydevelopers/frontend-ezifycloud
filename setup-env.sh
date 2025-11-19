#!/bin/bash

# Script to set up environment files for frontend

echo "Setting up frontend environment files..."

# Create .env.local for local development
cat > .env.local << 'EOF'
# Local Development Environment
# API Configuration
VITE_API_URL=http://localhost:9001/api

# App Configuration
VITE_APP_NAME=Ezify Cloud
VITE_APP_VERSION=1.0.0

# Environment
VITE_NODE_ENV=development
EOF

echo "✅ Created .env.local"

# Create .env.production for production
cat > .env.production << 'EOF'
# Production Environment
# API Configuration
VITE_API_URL=http://31.97.72.136/api

# App Configuration
VITE_APP_NAME=Ezify Cloud
VITE_APP_VERSION=1.0.0

# Environment
VITE_NODE_ENV=production
EOF

echo "✅ Created .env.production"
echo ""
echo "Environment files created successfully!"
echo "For local development, use: .env.local"
echo "For production builds, use: .env.production"


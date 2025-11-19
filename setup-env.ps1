# PowerShell script to set up environment files for frontend

Write-Host "Setting up frontend environment files..." -ForegroundColor Cyan

# Create .env.local for local development
@"
# Local Development Environment
# API Configuration
VITE_API_URL=http://localhost:9001/api

# App Configuration
VITE_APP_NAME=Ezify Cloud
VITE_APP_VERSION=1.0.0

# Environment
VITE_NODE_ENV=development
"@ | Out-File -FilePath .env.local -Encoding utf8

Write-Host "✅ Created .env.local" -ForegroundColor Green

# Create .env.production for production
@"
# Production Environment
# API Configuration
VITE_API_URL=http://31.97.72.136/api

# App Configuration
VITE_APP_NAME=Ezify Cloud
VITE_APP_VERSION=1.0.0

# Environment
VITE_NODE_ENV=production
"@ | Out-File -FilePath .env.production -Encoding utf8

Write-Host "✅ Created .env.production" -ForegroundColor Green
Write-Host ""
Write-Host "Environment files created successfully!" -ForegroundColor Cyan
Write-Host "For local development, use: .env.local" -ForegroundColor Yellow
Write-Host "For production builds, use: .env.production" -ForegroundColor Yellow


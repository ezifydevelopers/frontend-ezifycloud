# Environment Setup Guide

This guide explains how to set up environment variables for local development and production.

## Environment Files

Create the appropriate `.env` file based on your environment:

### Local Development (`.env.local`)

Create `frontend-ezifycloud/.env.local`:

```env
# Local Development Environment
# API Configuration
VITE_API_URL=http://localhost:9001/api

# App Configuration
VITE_APP_NAME=Ezify Cloud
VITE_APP_VERSION=1.0.0

# Environment
VITE_NODE_ENV=development
```

### Production (`.env.production`)

Create `frontend-ezifycloud/.env.production`:

```env
# Production Environment
# API Configuration
VITE_API_URL=http://31.97.72.136/api

# App Configuration
VITE_APP_NAME=Ezify Cloud
VITE_APP_VERSION=1.0.0

# Environment
VITE_NODE_ENV=production
```

## How Vite Loads Environment Files

Vite automatically loads environment files in this order (later files override earlier ones):

1. `.env` - Default for all environments
2. `.env.local` - Local overrides (gitignored)
3. `.env.[mode]` - Mode-specific (e.g., `.env.production`)
4. `.env.[mode].local` - Mode-specific local overrides (gitignored)

## Usage

- **Local Development**: Create `.env.local` with `VITE_API_URL=http://localhost:9001/api`
- **Production Build**: Create `.env.production` with `VITE_API_URL=http://31.97.72.136/api`

## Important Notes

1. All environment variables must be prefixed with `VITE_` to be exposed to the client
2. Environment files are loaded at build time, not runtime
3. For production, you may need to set these in your CI/CD pipeline or server environment
4. Never commit `.env.local` or `.env.production.local` files (they're gitignored)

## Troubleshooting

If the API URL is incorrect:
1. Check which `.env` file is being used
2. Verify the `VITE_API_URL` value
3. Restart the dev server after changing `.env` files
4. For production, rebuild the application after updating environment variables


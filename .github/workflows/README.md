# Frontend Deployment Workflow

This workflow automatically deploys the frontend application to the server when changes are pushed to `main` or `develop` branches.

## Server Configuration

- **Host**: `srv990936`
- **Username**: `leavesystem`
- **Deployment Path**: `~/apps/frontend-ezifycloud` (expands to `/home/leavesystem/apps/frontend-ezifycloud`)

## Required GitHub Secrets

These secrets should already be configured in your GitHub repository (Settings → Secrets → Actions):

```
PROD_HOST=srv990936
PROD_USERNAME=leavesystem
SSH_KEY=your_private_ssh_key_content
SSH_PORT=22 (optional, defaults to 22)
```

## Deployment Process

When you push to `main` or `develop` branch, the workflow will:

1. **Checkout** the latest code
2. **SSH into the server** (`srv990936`)
3. **Navigate** to `~/apps/frontend-ezifycloud`
4. **Pull** latest changes from GitHub
5. **Install** dependencies (`npm ci`)
6. **Build** the application (`npm run build`)
7. **Restart** nginx to serve the new build

## Manual Deployment

You can also trigger the deployment manually:
1. Go to **Actions** tab in GitHub
2. Select **Deploy Frontend** workflow
3. Click **Run workflow**
4. Choose the branch and click **Run workflow**

## Troubleshooting

- **SSH Connection Failed**: Check that `SSH_KEY` secret is correctly set
- **Build Failed**: Check Node.js version on server (should be 18.x or higher)
- **Nginx Not Restarting**: 
  - The build completes successfully even if nginx restart fails
  - To enable automatic nginx restart, configure passwordless sudo on the server:
    ```bash
    sudo visudo
    # Add this line:
    leavesystem ALL=(ALL) NOPASSWD: /bin/systemctl restart nginx
    ```
  - Or restart nginx manually after deployment: `sudo systemctl restart nginx`
- **Build Files Not Updating**: Verify the build output directory matches nginx configuration

## Nginx Configuration

Make sure your nginx is configured to serve files from the build directory (typically `~/apps/frontend-ezifycloud/dist`).

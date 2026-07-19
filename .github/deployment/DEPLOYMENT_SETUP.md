# GitHub Actions Deployment Setup

This guide will help you set up automatic deployment to Vercel using GitHub Actions.

## Required GitHub Secrets

You need to add these secrets to your GitHub repository:

### 1. Get Vercel Token

1. Go to [Vercel Dashboard](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Give it a name like "GitHub Actions"
4. Copy the token

### 2. Vercel Organization ID

Your **VERCEL_ORG_ID**: `62aRO89O4vzRpaUYPZBCDnAX`

### 3. Vercel Project ID

Your **VERCEL_PROJECT_ID**: `8FBpmeImltXNxm0jktxbZF29`

## Adding Secrets to GitHub

1. Go to your GitHub repository: https://github.com/PiotrRomanczuk/strummy
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** for each of these:

| Secret Name         | Value                         | Description             |
| ------------------- | ----------------------------- | ----------------------- |
| `VERCEL_TOKEN`      | Your Vercel token from step 1 | Authentication token    |
| `VERCEL_ORG_ID`     | `62aRO89O4vzRpaUYPZBCDnAX`    | Organization identifier |
| `VERCEL_PROJECT_ID` | `8FBpmeImltXNxm0jktxbZF29`    | Project identifier      |

## Optional: Environment Variables

If you want to add environment variables for your deployment, add them as secrets with these prefixes:

- `VERCEL_ENV_NEXT_PUBLIC_SUPABASE_URL`
- `VERCEL_ENV_NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `VERCEL_ENV_SUPABASE_SERVICE_ROLE_KEY`

## How It Works

Once set up, the workflow will:

### On Push to Main Branch:

1. ✅ Checkout code
2. ✅ Install dependencies
3. ✅ Run tests
4. ✅ Run linting
5. ✅ Build project
6. 🚀 Deploy to Vercel production

### On Pull Requests:

1. ✅ Checkout code
2. ✅ Install dependencies
3. ✅ Run tests
4. ✅ Run linting
5. ✅ Build project
6. 🔍 Deploy to Vercel preview (preview URL)

## Testing the Setup

After adding the secrets:

1. Make a small change to any file
2. Commit and push:
   ```bash
   git add .
   git commit -m "test: trigger GitHub Actions deployment"
   git push origin main
   ```
3. Go to your repository → **Actions** tab
4. You should see the workflow running
5. When complete, your site will be automatically deployed!

## Workflow File Location

The workflow is defined in: `.github/workflows/deploy.yml`

## Benefits

✅ **Automatic deployments** on every push to main  
✅ **Preview deployments** for pull requests  
✅ **Quality gates** (tests and linting must pass)  
✅ **Build verification** before deployment  
✅ **No manual intervention** required  
✅ **Full deployment history** in GitHub Actions

## Troubleshooting

If the deployment fails:

1. Check the **Actions** tab in your GitHub repository
2. Click on the failed workflow to see logs
3. Common issues:
   - Missing or incorrect secrets
   - Test failures
   - Build errors
   - Linting errors

The workflow will prevent deployment if any quality checks fail, ensuring only working code reaches production! 🚀

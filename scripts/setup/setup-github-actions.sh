#!/bin/bash

# GitHub Actions Setup Helper
# Run this script to get the information needed for GitHub secrets

echo "🚀 GITHUB ACTIONS VERCEL DEPLOYMENT SETUP"
echo "========================================"
echo ""

echo "📋 STEP 1: GitHub Secrets Required"
echo "Add these secrets to your GitHub repository:"
echo "https://github.com/PiotrRomanczuk/strummy/settings/secrets/actions"
echo ""

echo "🔑 Secret Values:"
echo "VERCEL_ORG_ID: 62aRO89O4vzRpaUYPZBCDnAX"
echo "VERCEL_PROJECT_ID: 8FBpmeImltXNxm0jktxbZF29"
echo ""

echo "🎟️  VERCEL_TOKEN: You need to create this at:"
echo "https://vercel.com/account/tokens"
echo "1. Click 'Create Token'"
echo "2. Name it 'GitHub Actions'"
echo "3. Copy the token and add it as VERCEL_TOKEN secret"
echo ""

echo "📝 STEP 2: Add Secrets to GitHub"
echo "1. Go to: https://github.com/PiotrRomanczuk/strummy/settings/secrets/actions"
echo "2. Click 'New repository secret' for each:"
echo "   - VERCEL_TOKEN (from Vercel dashboard)"
echo "   - VERCEL_ORG_ID (value above)"
echo "   - VERCEL_PROJECT_ID (value above)"
echo ""

echo "🧪 STEP 3: Test the Setup"
echo "After adding secrets, test with:"
echo "git add ."
echo "git commit -m 'test: trigger GitHub Actions deployment'"
echo "git push origin main"
echo ""

echo "📊 Monitor at: https://github.com/PiotrRomanczuk/strummy/actions"
echo ""
echo "✅ Once setup, every push to main = automatic deployment!"
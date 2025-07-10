# 🚀 Quick Start Deployment Guide

Get your OSR Assessment Tool deployed in 15 minutes!

## Step 1: Upload to GitHub (2 minutes)

1. Create a new repository on GitHub
2. Upload all files from this package to your repository
3. Make sure the repository is public or private (your choice)

## Step 2: Deploy Backend (5 minutes)

**Recommended: Railway (Easiest)**

1. Go to [Railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Set root directory to `backend`
6. Deploy automatically
7. **Copy the generated URL** (e.g., `https://your-app.railway.app`)

## Step 3: Deploy Frontend (5 minutes)

1. Go to [Netlify.com](https://netlify.com)
2. Click "New site from Git" → "GitHub"
3. Select your repository
4. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
5. Deploy the site

## Step 4: Connect Frontend to Backend (3 minutes)

1. In Netlify dashboard, go to "Site settings"
2. Click "Environment variables"
3. Add new variable:
   - **Key**: `VITE_BACKEND_URL`
   - **Value**: Your Railway backend URL from Step 2
4. Go to "Deploys" and click "Trigger deploy"

## ✅ Done!

Your collaborative OSR Assessment Tool is now live!

- **Frontend**: Your Netlify URL
- **Backend**: Your Railway URL
- **Collaboration**: Fully functional

## 🧪 Test It

1. Visit your Netlify URL
2. Click on a store
3. Answer some questions
4. Open the same assessment in another browser tab
5. See real-time collaboration in action!

## 🆘 Need Help?

Check the detailed `deployment-guide.md` for troubleshooting and advanced configuration.


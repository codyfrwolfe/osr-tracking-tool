# OSR Assessment Tool - Complete Deployment Guide

This guide provides step-by-step instructions for deploying the Market 448 OSR Scoring Tool to GitHub and various hosting platforms.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [GitHub Setup](#github-setup)
3. [Frontend Deployment (Netlify)](#frontend-deployment-netlify)
4. [Backend Deployment Options](#backend-deployment-options)
5. [Environment Configuration](#environment-configuration)
6. [Testing Your Deployment](#testing-your-deployment)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting, ensure you have:

- Git installed on your computer
- A GitHub account
- A Netlify account (free tier available)
- A backend hosting account (Railway, Heroku, or Render - free tiers available)
- Node.js 18+ installed locally for testing

## GitHub Setup

### Step 1: Create a New Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Name your repository (e.g., `market-448-osr-tool`)
5. Set it to **Public** or **Private** (your choice)
6. **Do NOT** initialize with README, .gitignore, or license (we have these files already)
7. Click "Create repository"

### Step 2: Upload Your Code

#### Option A: Using Git Command Line

```bash
# Navigate to your project folder
cd path/to/osr-deployment-package

# Initialize git repository
git init

# Add all files
git add .

# Make initial commit
git commit -m "Initial commit: OSR Assessment Tool"

# Add your GitHub repository as origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# Push to GitHub
git push -u origin main
```

#### Option B: Using GitHub Desktop

1. Download and install [GitHub Desktop](https://desktop.github.com/)
2. Open GitHub Desktop and sign in
3. Click "Add an Existing Repository from your Hard Drive"
4. Select your `osr-deployment-package` folder
5. Click "Publish repository" and select your GitHub account
6. Choose the repository name and click "Publish Repository"

#### Option C: Using GitHub Web Interface

1. In your new GitHub repository, click "uploading an existing file"
2. Drag and drop all files from your `osr-deployment-package` folder
3. Write a commit message: "Initial commit: OSR Assessment Tool"
4. Click "Commit changes"

## Frontend Deployment (Netlify)

### Step 1: Connect GitHub to Netlify

1. Go to [Netlify.com](https://netlify.com) and sign in
2. Click "New site from Git"
3. Choose "GitHub" as your Git provider
4. Authorize Netlify to access your GitHub account
5. Select your OSR tool repository

### Step 2: Configure Build Settings

1. **Base directory**: `frontend`
2. **Build command**: `npm run build`
3. **Publish directory**: `frontend/dist`
4. Click "Deploy site"

### Step 3: Configure Environment Variables

1. In your Netlify dashboard, go to "Site settings"
2. Click "Environment variables" in the sidebar
3. Add a new variable:
   - **Key**: `VITE_BACKEND_URL`
   - **Value**: Your backend URL (see backend deployment section)
4. Click "Save"

### Step 4: Set Custom Domain (Optional)

1. In Site settings, click "Domain management"
2. Click "Add custom domain"
3. Enter your domain name
4. Follow the DNS configuration instructions

## Backend Deployment Options

Choose one of the following platforms for your backend:

### Option A: Railway (Recommended - Easy Setup)

1. Go to [Railway.app](https://railway.app) and sign in with GitHub
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your OSR tool repository
5. Select the `backend` folder as the root directory
6. Railway will automatically detect it's a Python project
7. Your backend will be deployed automatically
8. Copy the generated URL (e.g., `https://your-app.railway.app`)

### Option B: Heroku (Popular Choice)

1. Go to [Heroku.com](https://heroku.com) and create an account
2. Install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
3. Open terminal and navigate to your backend folder:

```bash
cd backend
heroku login
heroku create your-app-name
git init
git add .
git commit -m "Deploy backend"
heroku git:remote -a your-app-name
git push heroku main
```

4. Your backend will be available at `https://your-app-name.herokuapp.com`

### Option C: Render (Free Tier Available)

1. Go to [Render.com](https://render.com) and sign in with GitHub
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: osr-backend
   - **Root Directory**: backend
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python src/main.py`
5. Click "Create Web Service"
6. Your backend will be available at the generated URL

## Environment Configuration

### Update Frontend with Backend URL

After deploying your backend:

1. Copy your backend URL
2. Go to your Netlify dashboard
3. Navigate to "Site settings" → "Environment variables"
4. Update the `VITE_BACKEND_URL` variable with your backend URL
5. Trigger a new deployment by going to "Deploys" and clicking "Trigger deploy"

### Backend Environment Variables

If using a production database, set these environment variables in your backend hosting platform:

- `FLASK_ENV`: `production`
- `PORT`: Usually set automatically by the platform
- `DATABASE_URL`: If using PostgreSQL instead of SQLite

## Testing Your Deployment

### Step 1: Test Frontend

1. Visit your Netlify URL
2. Verify the store selection page loads
3. Click on a store to test navigation
4. Check browser console for any errors

### Step 2: Test Backend

1. Visit your backend URL directly
2. You should see the frontend interface (if static files are served)
3. Test API endpoints:
   - `YOUR_BACKEND_URL/api/get_responses/1563/availability`

### Step 3: Test Full Integration

1. Open your Netlify frontend
2. Navigate to an assessment
3. Answer some questions
4. Refresh the page to verify responses persist
5. Open the same assessment in a different browser/device to test collaboration

## Troubleshooting

### Common Issues and Solutions

#### Frontend Issues

**Problem**: "Failed to load resource" errors
**Solution**: 
- Check that `VITE_BACKEND_URL` is set correctly in Netlify
- Ensure your backend is running and accessible
- Verify CORS is enabled in your backend

**Problem**: 404 errors on page refresh
**Solution**: 
- Ensure `_redirects` file is in the `public` folder
- Check that Netlify build settings are correct

#### Backend Issues

**Problem**: "Application Error" on backend
**Solution**:
- Check the logs in your hosting platform dashboard
- Verify all dependencies are in `requirements.txt`
- Ensure `PORT` environment variable is set correctly

**Problem**: Database errors
**Solution**:
- For SQLite: Ensure the database directory exists
- For PostgreSQL: Check `DATABASE_URL` environment variable
- Verify database tables are created on first run

#### CORS Issues

**Problem**: "CORS policy" errors in browser console
**Solution**:
- Verify Flask-CORS is installed: `pip install flask-cors`
- Check that CORS is configured for all origins: `CORS(app, origins="*")`
- Ensure your backend URL is correct in frontend

### Getting Help

If you encounter issues:

1. Check the browser console for error messages
2. Review the hosting platform logs
3. Verify all environment variables are set correctly
4. Test the backend API endpoints directly
5. Ensure both frontend and backend are using the same API endpoints

### Performance Optimization

For production use:

1. **Frontend**:
   - Enable Netlify's asset optimization
   - Configure caching headers
   - Use a CDN for static assets

2. **Backend**:
   - Use a production database (PostgreSQL)
   - Enable database connection pooling
   - Add rate limiting for API endpoints
   - Implement proper error logging

## Security Considerations

For production deployment:

1. **Environment Variables**: Never commit sensitive data to Git
2. **CORS**: Restrict origins to your frontend domain only
3. **Database**: Use environment variables for database credentials
4. **HTTPS**: Ensure both frontend and backend use HTTPS
5. **API Keys**: Implement authentication if needed

## Maintenance

### Regular Updates

1. **Dependencies**: Keep npm and pip packages updated
2. **Security**: Monitor for security vulnerabilities
3. **Backups**: Regular database backups for production
4. **Monitoring**: Set up uptime monitoring for your services

### Scaling Considerations

As your usage grows:

1. **Database**: Migrate from SQLite to PostgreSQL
2. **Caching**: Implement Redis for session storage
3. **Load Balancing**: Use multiple backend instances
4. **CDN**: Implement a content delivery network

---

## 🎉 Congratulations!

You now have a fully deployed, collaborative OSR Assessment Tool! Your team can access it from anywhere and work together on assessments in real-time.

**Frontend URL**: Your Netlify domain
**Backend URL**: Your chosen backend hosting platform
**Collaboration**: Fully functional with real-time data sync

For additional support or questions, refer to the documentation of your chosen hosting platforms or contact your development team.


# OSR Assessment Tool - Railway Deployment Guide

This guide provides step-by-step instructions for deploying the OSR Assessment Tool backend to Railway.

## Prerequisites

- A Railway account
- Git installed on your local machine
- A Git repository (GitHub, GitLab, etc.)

## Step 1: Prepare the Code

1. Download and extract the provided zip file
2. Copy all files to your project directory

## Step 2: Push to Git

1. Initialize a Git repository (if not already done):
   ```
   git init
   ```

2. Add all files:
   ```
   git add .
   ```

3. Commit the changes:
   ```
   git commit -m "Initial commit"
   ```

4. Add your remote repository:
   ```
   git remote add origin <your-repository-url>
   ```

5. Push to the remote repository:
   ```
   git push -u origin main
   ```

## Step 3: Deploy to Railway

1. Log in to your Railway account
2. Create a new project
3. Choose "Deploy from GitHub repo"
4. Connect your GitHub account (if not already connected)
5. Select the repository containing the code
6. Railway will automatically deploy the application

## Step 4: Verify the Deployment

1. Once the deployment is complete, Railway will provide a URL for your application
2. Visit the URL to verify that the application is running
3. Check the health check endpoint at `/api/health`

## Troubleshooting

If the deployment fails, check the following:

1. Ensure that the Procfile is correctly configured
2. Check the Railway logs for any errors
3. Verify that the health check endpoint is working correctly

## Next Steps

Once the basic deployment is working, you can:

1. Add your API routes to the app.py file
2. Connect to a database
3. Implement authentication
4. Add more features to the application

## Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Gunicorn Documentation](https://docs.gunicorn.org/)


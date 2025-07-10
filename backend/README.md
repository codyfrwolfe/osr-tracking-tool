# OSR Assessment Tool - Railway Deployment

This is a simplified version of the OSR Assessment Tool backend for deployment on Railway.

## Deployment Instructions

1. Push this code to your Git repository
2. Create a new project on Railway
3. Connect your Git repository to Railway
4. Railway will automatically deploy the application
5. The health check endpoint will be available at `/api/health`

## Local Development

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Run the application:
   ```
   python app.py
   ```

3. The application will be available at http://localhost:8080

## Files

- `app.py`: Main Flask application
- `wsgi.py`: WSGI entry point
- `Procfile`: Railway deployment configuration
- `requirements.txt`: Python dependencies
- `runtime.txt`: Python version for Railway

## Health Check

The health check endpoint is available at `/api/health` and returns a JSON response with the following structure:

```json
{
  "status": "healthy",
  "timestamp": "2025-07-10T15:37:41.123456",
  "service": "OSR Assessment API"
}
```


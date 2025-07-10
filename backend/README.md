# OSR Assessment Tool Backend

This is the backend API for the OSR Assessment Tool, built with Flask and optimized for deployment on Railway.

## 🚀 Deployment to Railway

### Prerequisites

- A Railway account
- Git repository with this code

### Deployment Steps

1. Push this code to your Git repository (GitHub, GitLab, etc.)
2. Log in to your Railway account
3. Create a new project
4. Choose "Deploy from GitHub repo"
5. Connect your GitHub account if not already connected
6. Select the repository containing this code
7. Configure environment variables in Railway:
   - `FLASK_ENV`: `production`
   - `FLASK_DEBUG`: `false`
   - `SECRET_KEY`: A secure random string
   - `PYTHONUNBUFFERED`: `1`
   - `MALLOC_ARENA_MAX`: `2`
   - `PYTHONHASHSEED`: `random`
   - `WEB_CONCURRENCY`: `2`
   - `WORKER_CLASS`: `gevent`
   - `TIMEOUT`: `120`
   - `KEEP_ALIVE`: `5`
   - `MAX_REQUESTS`: `1000`
   - `MAX_REQUESTS_JITTER`: `50`
8. Railway will automatically deploy your backend

## 🔧 Local Development

### Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the development server:
   ```bash
   python src/main.py
   ```

4. The API will be available at http://localhost:5000

### Testing

To test the WSGI configuration locally:

```bash
python test_wsgi.py
```

## 📁 Project Structure

```
backend/
├── Procfile                # Railway deployment configuration
├── README.md               # This file
├── requirements.txt        # Python dependencies
├── runtime.txt             # Python version for Railway
├── wsgi.py                 # WSGI entry point
├── test_wsgi.py            # Test script for WSGI
└── src/
    ├── __init__.py
    ├── main.py             # Main Flask application
    ├── database/
    │   ├── __init__.py
    │   └── app.db          # SQLite database
    ├── models/
    │   ├── __init__.py
    │   ├── assessment.py   # Assessment data models
    │   └── user.py         # User data models
    ├── routes/
    │   ├── __init__.py
    │   └── assessment.py   # API routes
    └── static/             # Static files
```

## 🔍 Troubleshooting

### Railway Deployment Issues

If you encounter issues with Railway deployment:

1. Check the deployment logs in Railway dashboard
2. Ensure the health check endpoint is working correctly
3. Verify that all environment variables are set correctly
4. Check that the Procfile is correctly configured

### Common Issues

- **Health check failing**: Ensure the `/api/health` endpoint is accessible and returns a 200 status code
- **Database errors**: Check that the database file exists and has the correct permissions
- **Import errors**: Verify that the Python path is correctly set up in wsgi.py

## 📝 API Documentation

### Endpoints

- `GET /api/health`: Health check endpoint
- `POST /api/save_response`: Save a response to a question
- `GET /api/get_responses/<store>/<section>`: Get all responses for a store and section
- `GET /api/get_store_score/<store>`: Get the overall score for a store
- `GET /api/get_section_score/<store>/<section>`: Get the score for a specific section of a store

### Example Requests

#### Health Check

```bash
curl -X GET https://your-railway-app.up.railway.app/api/health
```

#### Save Response

```bash
curl -X POST https://your-railway-app.up.railway.app/api/save_response \
  -H "Content-Type: application/json" \
  -d '{
    "store": "1563",
    "section": "availability",
    "question": 1,
    "response": "yes"
  }'
```

#### Get Store Score

```bash
curl -X GET https://your-railway-app.up.railway.app/api/get_store_score/1563
```

## 📊 Performance Optimizations

This backend includes several optimizations for Railway deployment:

1. **WSGI Server**: Uses Gunicorn with gevent workers for better concurrency
2. **Session Handling**: Optimized session storage compatible with Railway
3. **Memory Management**: Periodic garbage collection and response compression
4. **Error Handling**: Comprehensive error handling with detailed logging
5. **Caching**: Response caching for frequently accessed endpoints


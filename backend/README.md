# OSR Assessment Tool - Optimized Backend

This is an optimized version of the OSR Assessment Tool backend, configured for production deployment on Railway with Gunicorn WSGI server.

## 🚀 Features

- **Gunicorn WSGI Server**: Production-ready WSGI server with gevent worker class for better concurrency
- **Session Handling**: Secure session management with Flask-Session
- **Memory Optimization**: Garbage collection and response compression to reduce memory usage
- **Error Handling**: Comprehensive error handling with detailed logging
- **Caching Strategy**: Response caching to reduce API load and improve performance
- **Railway Configuration**: Optimized deployment settings for Railway

## 📋 Requirements

- Python 3.11+
- Flask 3.1.1+
- Gunicorn 21.2.0+
- Gevent 23.9.1+
- Flask-Session 0.5.0+
- Flask-Caching 2.1.0+
- Psutil 5.9.6+

## 🛠️ Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the development server:
   ```bash
   python src/main.py
   ```
4. The API will be available at http://localhost:5000

## 🚢 Deployment to Railway

1. Create a new project on Railway
2. Connect your GitHub repository
3. Configure the environment variables:
   - `FLASK_ENV`: `production`
   - `FLASK_DEBUG`: `false`
   - `SECRET_KEY`: A secure random string
   - `PORT`: Automatically set by Railway
4. Deploy the application

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FLASK_ENV` | Environment mode (`development` or `production`) | `production` |
| `FLASK_DEBUG` | Enable debug mode | `false` |
| `SECRET_KEY` | Secret key for session encryption | `change-this-in-production-environment` |
| `PORT` | Port to listen on | `5000` |
| `HOST` | Host to bind to | `0.0.0.0` |
| `WEB_CONCURRENCY` | Number of Gunicorn workers | `2` |
| `WORKER_CLASS` | Gunicorn worker class | `gevent` |
| `TIMEOUT` | Gunicorn timeout in seconds | `120` |
| `KEEP_ALIVE` | Gunicorn keepalive in seconds | `5` |
| `MAX_REQUESTS` | Maximum requests per worker before restart | `1000` |
| `MAX_REQUESTS_JITTER` | Jitter for max requests | `50` |

## 📚 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check endpoint |
| `/api/save_response` | POST | Save a single assessment response |
| `/api/get_responses/<store>/<section>` | GET | Get all responses for a specific store and section |
| `/api/get_store_score/<store>` | GET | Get overall score for a store |
| `/api/get_section_score/<store>/<section>` | GET | Get score for a specific section |
| `/api/batch_save_responses` | POST | Save multiple responses at once |
| `/api/refresh_scores/<store>/<section>` | POST | Refresh scores for a store/section |
| `/api/debug/storage` | GET | Debug endpoint to view all stored data |
| `/api/debug/cache` | GET | Debug endpoint to view cache statistics |
| `/api/debug/clear_cache` | POST | Debug endpoint to clear the cache |

## 📊 Performance Monitoring

The `/api/health` endpoint provides basic performance metrics:
- Process memory usage
- Available system memory
- Memory usage percentage

## 🔒 Security

- CORS is configured to allow requests from any origin
- Sessions are signed and encrypted
- Error messages are sanitized in production mode

## 📝 Logging

Logs are written to both stdout and `api.log` file with the following format:
```
%(asctime)s - %(name)s - %(levelname)s - %(message)s
```

## 🧪 Testing

To run the application in development mode:
```bash
FLASK_ENV=development python src/main.py
```

To run the application with Gunicorn:
```bash
gunicorn wsgi:app --workers=2 --worker-class=gevent --timeout=120 --log-level=info --bind=0.0.0.0:5000
```


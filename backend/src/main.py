#!/usr/bin/env python3
"""
OSR Assessment Tool - Flask Backend - v1.0
Optimized version with Gunicorn WSGI server, session handling, and memory optimization
"""

from flask import Flask, jsonify, request, send_from_directory, session
from flask_cors import CORS
from flask_session import Session
import os
import sys
import logging
import multiprocessing
import gc
import gzip
import psutil
from datetime import datetime, timedelta

# Import the assessment blueprint
from routes.assessment import assessment_bp

def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__)
    
    # Enhanced application configuration
    app.config.update(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev-key-change-in-production'),
        SESSION_TYPE='filesystem',  # Use filesystem for session storage
        SESSION_PERMANENT=True,
        PERMANENT_SESSION_LIFETIME=timedelta(days=30),
        SESSION_USE_SIGNER=True,
        SESSION_FILE_DIR='/tmp/flask_session',  # Use /tmp for Railway
        SESSION_FILE_THRESHOLD=500,
        JSON_SORT_KEYS=False,
        JSONIFY_PRETTYPRINT_REGULAR=False,
        MAX_CONTENT_LENGTH=16 * 1024 * 1024,  # 16 MB max upload
    )
    
    # Initialize Flask-Session
    Session(app)
    
    # Configure CORS to allow all origins (required for frontend-backend communication)
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "Accept"]
        }
    })
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('api.log')
        ]
    )
    app.logger.setLevel(logging.INFO)
    
    # Register the assessment blueprint with proper URL prefix
    app.register_blueprint(assessment_bp, url_prefix="/api")
    app.logger.info("✅ Assessment blueprint registered at /api")
    
    # Add periodic garbage collection
    @app.before_request
    def before_request():
        """Run garbage collection before each request to free memory"""
        gc.collect()
        
    # Limit response size and compress responses
    @app.after_request
    def after_request(response):
        """Compress responses to reduce bandwidth usage"""
        # Compress responses larger than 500 bytes
        if (response.content_length is not None and 
            response.content_length > 500 and 
            (response.content_type.startswith('text/') or 
             response.content_type == 'application/json')):
            response.headers['Content-Encoding'] = 'gzip'
            response.set_data(gzip.compress(response.get_data()))
        
        # Add CORS headers
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        
        return response
    
    # Health check endpoint (not in blueprint for simplicity)
    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint that returns proper JSON with memory usage info"""
        try:
            # Get memory usage information
            process = psutil.Process(os.getpid())
            memory_info = process.memory_info()
            memory_usage_mb = memory_info.rss / (1024 * 1024)  # Convert to MB
            
            # Get system memory information
            system_memory = psutil.virtual_memory()
            available_memory_mb = system_memory.available / (1024 * 1024)  # Convert to MB
            
            return jsonify({
                'success': True,
                'status': 'healthy',
                'timestamp': datetime.utcnow().isoformat(),
                'service': 'OSR Assessment API',
                'version': '1.1.0',
                'environment': os.environ.get('FLASK_ENV', 'production'),
                'memory_usage': {
                    'process_memory_mb': round(memory_usage_mb, 2),
                    'available_memory_mb': round(available_memory_mb, 2),
                    'percent_used': round(system_memory.percent, 2)
                }
            }), 200
        except Exception as e:
            app.logger.error(f"Health check error: {str(e)}")
            return jsonify({
                'success': False,
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }), 500
    
    # Root endpoint
    @app.route('/', methods=['GET'])
    def root():
        """Root endpoint that returns API info"""
        return jsonify({
            'success': True,
            'message': 'OSR Assessment API is running',
            'endpoints': {
                'health': '/api/health',
                'save_response': '/api/save_response',
                'get_responses': '/api/get_responses/<store>/<section>',
                'get_store_score': '/api/get_store_score/<store>',
                'get_section_score': '/api/get_section_score/<store>/<section>'
            },
            'timestamp': datetime.utcnow().isoformat()
        })
    
    # Error handlers that return JSON instead of HTML
    @app.errorhandler(404)
    def not_found(error):
        """Return JSON for 404 errors instead of HTML"""
        return jsonify({
            'success': False,
            'error': 'Endpoint not found',
            'message': f'The requested URL {request.url} was not found on this server.',
            'available_endpoints': [
                '/api/health',
                '/api/save_response',
                '/api/get_responses/<store>/<section>',
                '/api/get_store_score/<store>',
                '/api/get_section_score/<store>/<section>'
            ]
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        """Return JSON for 500 errors instead of HTML"""
        app.logger.error(f"Internal server error: {str(error)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': 'An internal server error occurred.'
        }), 500
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        """Return JSON for 405 errors instead of HTML"""
        return jsonify({
            'success': False,
            'error': 'Method not allowed',
            'message': f'The method {request.method} is not allowed for the requested URL.'
        }), 405
    
    @app.errorhandler(Exception)
    def handle_exception(e):
        """Global error handler for all exceptions"""
        app.logger.error(f"Unhandled exception: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': str(e) if app.debug else 'An unexpected error occurred',
            'status_code': 500
        }), 500
    
    # Log all registered routes for debugging
    app.logger.info("📋 Registered routes:")
    for rule in app.url_map.iter_rules():
        app.logger.info(f"  {rule.methods} {rule.rule}")
    
    return app

# Create the Flask app
app = create_app()

# Gunicorn WSGI server configuration
class StandaloneApplication(object):
    def __init__(self, app, options=None):
        self.options = options or {}
        self.application = app
        
    def __call__(self):
        return self.application

if __name__ == '__main__':
    # Get port from environment variable or default to 5000
    port = int(os.environ.get('PORT', 5000))
    
    # Get host from environment variable or default to 0.0.0.0 for deployment
    host = os.environ.get('HOST', '0.0.0.0')
    
    # Get debug mode from environment variable
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    # Get environment (development or production)
    env = os.environ.get('FLASK_ENV', 'production')
    
    print(f"🚀 Starting OSR Assessment API server...")
    print(f"   Host: {host}")
    print(f"   Port: {port}")
    print(f"   Debug: {debug}")
    print(f"   Environment: {env}")
    print(f"   API Base URL: http://{host}:{port}/api")
    
    if env == 'development':
        # Use Flask development server for development
        app.run(
            host=host,
            port=port,
            debug=debug,
            threaded=True
        )
    else:
        # Use Gunicorn for production
        try:
            import gunicorn.app.base
            
            class StandaloneApplication(gunicorn.app.base.BaseApplication):
                def __init__(self, app, options=None):
                    self.options = options or {}
                    self.application = app
                    super().__init__()
                    
                def load_config(self):
                    for key, value in self.options.items():
                        if key in self.cfg.settings and value is not None:
                            self.cfg.set(key.lower(), value)
                            
                def load(self):
                    return self.application
            
            # Calculate optimal number of workers based on CPU cores
            workers = (2 * multiprocessing.cpu_count()) + 1
            
            # Configure Gunicorn options
            options = {
                'bind': f'{host}:{port}',
                'workers': workers,
                'worker_class': 'gevent',
                'timeout': 120,
                'keepalive': 5,
                'max_requests': 1000,
                'max_requests_jitter': 50,
                'accesslog': '-',
                'errorlog': '-',
                'loglevel': 'info'
            }
            
            print(f"   Starting Gunicorn WSGI server with {workers} workers")
            StandaloneApplication(app, options).run()
            
        except ImportError:
            print("⚠️ Gunicorn not installed. Falling back to Flask development server.")
            app.run(
                host=host,
                port=port,
                debug=debug,
                threaded=True
            )


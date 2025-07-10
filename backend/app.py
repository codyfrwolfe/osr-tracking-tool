#!/usr/bin/env python3
"""
OSR Assessment Tool - Flask Backend
Simplified version for Railway deployment
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import logging
import datetime

# Create the Flask app
app = Flask(__name__)

# Configure CORS to allow all origins
CORS(app)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for Railway"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.datetime.utcnow().isoformat(),
        'service': 'OSR Assessment API'
    }), 200

# Root endpoint
@app.route('/', methods=['GET'])
def root():
    """Root endpoint"""
    return jsonify({
        'message': 'OSR Assessment API is running',
        'endpoints': {
            'health': '/api/health'
        }
    })

# Error handler for 404
@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'error': 'Not found',
        'message': 'The requested URL was not found on the server.'
    }), 404

# Error handler for 500
@app.errorhandler(500)
def server_error(error):
    """Handle 500 errors"""
    return jsonify({
        'error': 'Internal server error',
        'message': 'An internal server error occurred.'
    }), 500

if __name__ == '__main__':
    # Get port from environment variable or default to 8080
    port = int(os.environ.get('PORT', 8080))
    
    # Run the app
    app.run(host='0.0.0.0', port=port)


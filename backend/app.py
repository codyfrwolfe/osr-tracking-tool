#!/usr/bin/env python3
"""
OSR Assessment Tool - Flask Backend
Complete version with all API endpoints for Railway deployment
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import logging
import datetime
import traceback
from typing import Dict, Any
from functools import wraps

# Create the Flask app
app = Flask(__name__)

# Configure CORS to allow all origins
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
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# In-memory storage for development (replace with database in production)
# Structure: {store_id: {section_id: {question_id-procedure_index: response}}}
responses_storage: Dict[str, Dict[str, Dict[str, Any]]] = {}

# Error handling decorator
def handle_errors(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            # Log the full exception with traceback
            logger.error(f"Error in {f.__name__}: {str(e)}")
            logger.error(traceback.format_exc())
            
            # Return a JSON error response
            return jsonify({
                'success': False,
                'error': 'Internal server error',
                'message': str(e) if app.debug else 'An unexpected error occurred',
                'endpoint': request.path,
                'timestamp': datetime.datetime.utcnow().isoformat()
            }), 500
    return decorated_function

# Helper function to ensure store and section exist in storage
def ensure_storage_structure(store_id: str, section_id: str) -> None:
    """Ensure the storage structure exists for the given store and section"""
    if store_id not in responses_storage:
        responses_storage[store_id] = {}
    if section_id not in responses_storage[store_id]:
        responses_storage[store_id][section_id] = {}

# Helper function to calculate section score
def calculate_section_score(store_id: str, section_id: str) -> Dict[str, Any]:
    """Calculate the score for a specific section"""
    try:
        if store_id not in responses_storage or section_id not in responses_storage[store_id]:
            return {
                'score': 0,
                'max_score': 10,
                'percentage': 0,
                'color': 'red',
                'questions_completed': 0,
                'total_questions': 5,
                'normalized': True
            }
        
        section_responses = responses_storage[store_id][section_id]
        
        # Simple scoring logic (can be enhanced)
        total_responses = len(section_responses)
        positive_responses = sum(1 for resp in section_responses.values() 
                               if isinstance(resp, dict) and resp.get('hasIssues') == 'no')
        
        # Calculate score (2 points per positive response)
        score = positive_responses * 2
        max_score = total_responses * 2 if total_responses > 0 else 10
        
        # Normalize scores to ensure consistent max points
        standard_max_score = 10  # Standard max score for each section
        normalization_factor = standard_max_score / max_score if max_score > 0 else 1
        normalized_score = score * normalization_factor
        
        percentage = (normalized_score / standard_max_score * 100) if standard_max_score > 0 else 0
        
        # Determine color based on percentage
        if percentage >= 80:
            color = 'green'
        elif percentage >= 60:
            color = 'yellow'
        else:
            color = 'red'
        
        return {
            'score': round(normalized_score, 1),
            'raw_score': score,
            'max_score': standard_max_score,
            'raw_max_score': max_score,
            'percentage': round(percentage, 1),
            'color': color,
            'questions_completed': total_responses,
            'total_questions': max(total_responses, 5),
            'normalized': True
        }
    except Exception as e:
        logger.error(f"Error calculating section score: {e}")
        logger.error(traceback.format_exc())
        return {
            'score': 0,
            'max_score': 10,
            'percentage': 0,
            'color': 'red',
            'questions_completed': 0,
            'total_questions': 5,
            'normalized': True,
            'error': str(e)
        }

# Helper function to calculate store score
def calculate_store_score(store_id: str) -> Dict[str, Any]:
    """Calculate the overall score for a store"""
    try:
        if store_id not in responses_storage:
            return {
                'overall_score': 0,
                'overall_max_score': 46,
                'overall_percentage': 0,
                'overall_color': 'red',
                'sections_completed': 0,
                'total_sections': 5,
                'section_scores': {},
                'normalized': True
            }
        
        store_data = responses_storage[store_id]
        sections = ['availability', 'checkout', 'fulfillment', 'people', 'culture']
        
        total_score = 0
        total_max_score = 0
        sections_completed = 0
        section_scores = {}
        
        # Standard max scores for each section
        standard_section_scores = {
            'availability': 10,
            'checkout': 10,
            'fulfillment': 8,
            'people': 10,
            'culture': 8
        }
        
        for section in sections:
            section_score = calculate_section_score(store_id, section)
            section_scores[section] = section_score
            
            total_score += section_score['score']
            total_max_score += standard_section_scores.get(section, 10)
            
            if section_score['questions_completed'] > 0:
                sections_completed += 1
        
        overall_percentage = (total_score / total_max_score * 100) if total_max_score > 0 else 0
        
        # Determine overall color
        if overall_percentage >= 80:
            overall_color = 'green'
        elif overall_percentage >= 60:
            overall_color = 'yellow'
        else:
            overall_color = 'red'
        
        return {
            'overall_score': round(total_score, 1),
            'overall_max_score': total_max_score,
            'overall_percentage': round(overall_percentage, 1),
            'overall_color': overall_color,
            'sections_completed': sections_completed,
            'total_sections': len(sections),
            'section_scores': section_scores,
            'normalized': True
        }
    except Exception as e:
        logger.error(f"Error calculating store score: {e}")
        logger.error(traceback.format_exc())
        return {
            'overall_score': 0,
            'overall_max_score': 46,
            'overall_percentage': 0,
            'overall_color': 'red',
            'sections_completed': 0,
            'total_sections': 5,
            'section_scores': {},
            'normalized': True,
            'error': str(e)
        }

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for Railway"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.datetime.utcnow().isoformat(),
        'service': 'OSR Assessment API',
        'version': '2.0',
        'endpoints': [
            '/api/health',
            '/api/save_response',
            '/api/get_responses/<store>/<section>',
            '/api/get_store_score/<store>',
            '/api/get_section_score/<store>/<section>',
            '/api/batch_save_responses',
            '/api/refresh_scores/<store>/<section>'
        ]
    }), 200

# Root endpoint
@app.route('/', methods=['GET'])
def root():
    """Root endpoint"""
    return jsonify({
        'message': 'OSR Assessment API is running',
        'version': '2.0',
        'endpoints': {
            'health': '/api/health',
            'save_response': '/api/save_response',
            'get_responses': '/api/get_responses/<store>/<section>',
            'get_store_score': '/api/get_store_score/<store>',
            'get_section_score': '/api/get_section_score/<store>/<section>',
            'batch_save_responses': '/api/batch_save_responses',
            'refresh_scores': '/api/refresh_scores/<store>/<section>'
        }
    })

# API Endpoints

@app.route('/api/save_response', methods=['POST'])
@handle_errors
def save_response():
    """Save a single assessment response with error handling"""
    # Get JSON data from request
    data = request.get_json()
    
    if not data:
        return jsonify({
            'success': False,
            'error': 'No JSON data provided'
        }), 400
    
    # Validate required fields
    required_fields = ['store', 'section', 'question_id', 'procedure_index', 'response']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'success': False,
                'error': f'Missing required field: {field}'
            }), 400
    
    store_id = str(data['store'])
    section_id = str(data['section'])
    question_id = str(data['question_id'])
    procedure_index = str(data['procedure_index'])
    response = data['response']
    
    # Validate store and section IDs
    if not store_id or store_id == 'undefined':
        return jsonify({
            'success': False,
            'error': 'Invalid store ID'
        }), 400
    
    if not section_id or section_id == 'undefined':
        return jsonify({
            'success': False,
            'error': 'Invalid section ID'
        }), 400
    
    # Ensure storage structure exists
    ensure_storage_structure(store_id, section_id)
    
    # Create response key
    response_key = f"{question_id}-{procedure_index}"
    
    # Add timestamp to response
    if isinstance(response, dict):
        response['saved_timestamp'] = datetime.datetime.utcnow().isoformat()
    
    # Save the response
    responses_storage[store_id][section_id][response_key] = response
    
    logger.info(f"Saved response for {store_id}-{section_id}-{response_key}")
    
    # Return JSON response
    return jsonify({
        'success': True,
        'message': 'Response saved successfully',
        'store': store_id,
        'section': section_id,
        'question_id': question_id,
        'procedure_index': procedure_index,
        'timestamp': datetime.datetime.utcnow().isoformat()
    })

@app.route('/api/get_responses/<store>/<section>', methods=['GET'])
@handle_errors
def get_responses(store, section):
    """Get all responses for a specific store and section"""
    store_id = str(store)
    section_id = str(section)
    
    # Validate store and section IDs
    if not store_id or store_id == 'undefined':
        return jsonify({
            'success': False,
            'error': 'Invalid store ID'
        }), 400
    
    if not section_id or section_id == 'undefined':
        return jsonify({
            'success': False,
            'error': 'Invalid section ID'
        }), 400
    
    # Get responses from storage
    if store_id in responses_storage and section_id in responses_storage[store_id]:
        responses = responses_storage[store_id][section_id]
    else:
        responses = {}
    
    logger.info(f"Retrieved {len(responses)} responses for {store_id}-{section_id}")
    
    # Return JSON response
    return jsonify({
        'success': True,
        'store': store_id,
        'section': section_id,
        'responses': responses,
        'count': len(responses),
        'timestamp': datetime.datetime.utcnow().isoformat()
    })

@app.route('/api/get_store_score/<store>', methods=['GET'])
@handle_errors
def get_store_score(store):
    """Get overall score for a store"""
    store_id = str(store)
    
    # Validate store ID
    if not store_id or store_id == 'undefined':
        return jsonify({
            'success': False,
            'error': 'Invalid store ID'
        }), 400
    
    # Calculate store score
    score = calculate_store_score(store_id)
    
    logger.info(f"Calculated store score for {store_id}: {score['overall_percentage']}%")
    
    # Return JSON response
    return jsonify({
        'success': True,
        'store': store_id,
        'score': score,
        'timestamp': datetime.datetime.utcnow().isoformat()
    })

@app.route('/api/get_section_score/<store>/<section>', methods=['GET'])
@handle_errors
def get_section_score(store, section):
    """Get score for a specific section"""
    store_id = str(store)
    section_id = str(section)
    
    # Validate store and section IDs
    if not store_id or store_id == 'undefined':
        return jsonify({
            'success': False,
            'error': 'Invalid store ID'
        }), 400
    
    if not section_id or section_id == 'undefined':
        return jsonify({
            'success': False,
            'error': 'Invalid section ID'
        }), 400
    
    # Calculate section score
    score = calculate_section_score(store_id, section_id)
    
    logger.info(f"Calculated section score for {store_id}-{section_id}: {score['percentage']}%")
    
    # Return JSON response
    return jsonify({
        'success': True,
        'store': store_id,
        'section': section_id,
        'score': score,
        'timestamp': datetime.datetime.utcnow().isoformat()
    })

@app.route('/api/batch_save_responses', methods=['POST'])
@handle_errors
def batch_save_responses():
    """Save multiple responses at once with error handling"""
    # Get JSON data from request
    data = request.get_json()
    
    if not data:
        return jsonify({
            'success': False,
            'error': 'No JSON data provided'
        }), 400
    
    # Validate required fields
    required_fields = ['store', 'section', 'responses']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'success': False,
                'error': f'Missing required field: {field}'
            }), 400
    
    store_id = str(data['store'])
    section_id = str(data['section'])
    responses = data['responses']
    
    # Validate store and section IDs
    if not store_id or store_id == 'undefined':
        return jsonify({
            'success': False,
            'error': 'Invalid store ID'
        }), 400
    
    if not section_id or section_id == 'undefined':
        return jsonify({
            'success': False,
            'error': 'Invalid section ID'
        }), 400
    
    # Ensure storage structure exists
    ensure_storage_structure(store_id, section_id)
    
    # Save all responses
    saved_count = 0
    for response_key, response in responses.items():
        if isinstance(response, dict):
            response['saved_timestamp'] = datetime.datetime.utcnow().isoformat()
        
        responses_storage[store_id][section_id][response_key] = response
        saved_count += 1
    
    logger.info(f"Batch saved {saved_count} responses for {store_id}-{section_id}")
    
    # Return JSON response
    return jsonify({
        'success': True,
        'message': f'Batch saved {saved_count} responses successfully',
        'store': store_id,
        'section': section_id,
        'saved_count': saved_count,
        'timestamp': datetime.datetime.utcnow().isoformat()
    })

@app.route('/api/refresh_scores/<store>/<section>', methods=['POST'])
@handle_errors
def refresh_scores(store, section):
    """Refresh scores for a store/section"""
    store_id = str(store)
    section_id = str(section) if section != 'all' else None
    
    # Validate store ID
    if not store_id or store_id == 'undefined':
        return jsonify({
            'success': False,
            'error': 'Invalid store ID'
        }), 400
    
    # Recalculate scores
    if section_id:
        score = calculate_section_score(store_id, section_id)
        logger.info(f"Refreshed section score for {store_id}-{section_id}: {score['percentage']}%")
    else:
        score = calculate_store_score(store_id)
        logger.info(f"Refreshed store score for {store_id}: {score['overall_percentage']}%")
    
    # Return JSON response
    return jsonify({
        'success': True,
        'message': 'Scores refreshed successfully',
        'store': store_id,
        'section': section_id,
        'timestamp': datetime.datetime.utcnow().isoformat()
    })

# Debug endpoints
@app.route('/api/debug/storage', methods=['GET'])
@handle_errors
def debug_storage():
    """Debug endpoint to view all stored data"""
    return jsonify({
        'success': True,
        'storage': responses_storage,
        'stores_count': len(responses_storage),
        'timestamp': datetime.datetime.utcnow().isoformat()
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'error': 'Not found',
        'message': f'The requested URL {request.url} was not found on the server.',
        'available_endpoints': [
            '/api/health',
            '/api/save_response',
            '/api/get_responses/<store>/<section>',
            '/api/get_store_score/<store>',
            '/api/get_section_score/<store>/<section>',
            '/api/batch_save_responses',
            '/api/refresh_scores/<store>/<section>'
        ]
    }), 404

@app.errorhandler(500)
def server_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'message': 'An internal server error occurred.'
    }), 500

@app.errorhandler(405)
def method_not_allowed(error):
    """Handle 405 errors"""
    return jsonify({
        'success': False,
        'error': 'Method not allowed',
        'message': f'The method {request.method} is not allowed for the requested URL.'
    }), 405

if __name__ == '__main__':
    # Get port from environment variable or default to 8080
    port = int(os.environ.get('PORT', 8080))
    
    # Log startup information
    logger.info(f"🚀 Starting OSR Assessment API server...")
    logger.info(f"   Port: {port}")
    logger.info(f"   Environment: {os.environ.get('FLASK_ENV', 'production')}")
    logger.info(f"   Debug: {os.environ.get('FLASK_DEBUG', 'false')}")
    
    # Log all registered routes
    logger.info("📋 Registered API endpoints:")
    for rule in app.url_map.iter_rules():
        if rule.rule.startswith('/api/'):
            logger.info(f"  {list(rule.methods)} {rule.rule}")
    
    # Run the app
    app.run(host='0.0.0.0', port=port, debug=False)


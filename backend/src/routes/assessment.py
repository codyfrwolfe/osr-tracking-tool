"""
OSR Assessment API Routes
Optimized version with caching and enhanced error handling
"""

from flask import Blueprint, request, jsonify, current_app
from flask_caching import Cache
import json
import os
import logging
import traceback
from datetime import datetime
from typing import Dict, Any, Optional
from functools import wraps

# Create the blueprint
assessment_bp = Blueprint('assessment', __name__)

# Initialize caching
cache = Cache(config={
    'CACHE_TYPE': 'SimpleCache',  # In-memory cache
    'CACHE_DEFAULT_TIMEOUT': 300,  # 5 minutes
    'CACHE_THRESHOLD': 1000  # Maximum number of items
})

# Configure logging
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
                'message': str(e) if current_app.debug else 'An unexpected error occurred',
                'endpoint': request.path,
                'timestamp': datetime.utcnow().isoformat()
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

# Initialize cache when the blueprint is registered
@assessment_bp.record_once
def on_register(state):
    cache.init_app(state.app)
    logger.info("✅ Cache initialized for assessment blueprint")

@assessment_bp.route('/save_response', methods=['POST'])
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
        response['saved_timestamp'] = datetime.utcnow().isoformat()
    
    # Save the response
    responses_storage[store_id][section_id][response_key] = response
    
    logger.info(f"Saved response for {store_id}-{section_id}-{response_key}")
    
    # Invalidate cache for this store and section
    cache.delete(f'store_score_{store_id}')
    cache.delete(f'section_score_{store_id}_{section_id}')
    cache.delete(f'responses_{store_id}_{section_id}')
    
    # Return JSON response
    return jsonify({
        'success': True,
        'message': 'Response saved successfully',
        'store': store_id,
        'section': section_id,
        'question_id': question_id,
        'procedure_index': procedure_index,
        'timestamp': datetime.utcnow().isoformat()
    })

@assessment_bp.route('/get_responses/<store>/<section>', methods=['GET'])
@handle_errors
@cache.cached(timeout=60, key_prefix=lambda: f'responses_{request.view_args["store"]}_{request.view_args["section"]}')
def get_responses(store, section):
    """Get all responses for a specific store and section with caching"""
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
        'timestamp': datetime.utcnow().isoformat(),
        'cached': True
    })

@assessment_bp.route('/get_store_score/<store>', methods=['GET'])
@handle_errors
@cache.cached(timeout=60, key_prefix=lambda: f'store_score_{request.view_args["store"]}')
def get_store_score(store):
    """Get overall score for a store with caching"""
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
        'timestamp': datetime.utcnow().isoformat(),
        'cached': True
    })

@assessment_bp.route('/get_section_score/<store>/<section>', methods=['GET'])
@handle_errors
@cache.cached(timeout=60, key_prefix=lambda: f'section_score_{request.view_args["store"]}_{request.view_args["section"]}')
def get_section_score(store, section):
    """Get score for a specific section with caching"""
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
        'timestamp': datetime.utcnow().isoformat(),
        'cached': True
    })

@assessment_bp.route('/batch_save_responses', methods=['POST'])
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
            response['saved_timestamp'] = datetime.utcnow().isoformat()
        
        responses_storage[store_id][section_id][response_key] = response
        saved_count += 1
    
    logger.info(f"Batch saved {saved_count} responses for {store_id}-{section_id}")
    
    # Invalidate cache for this store and section
    cache.delete(f'store_score_{store_id}')
    cache.delete(f'section_score_{store_id}_{section_id}')
    cache.delete(f'responses_{store_id}_{section_id}')
    
    # Return JSON response
    return jsonify({
        'success': True,
        'message': f'Batch saved {saved_count} responses successfully',
        'store': store_id,
        'section': section_id,
        'saved_count': saved_count,
        'timestamp': datetime.utcnow().isoformat()
    })

@assessment_bp.route('/refresh_scores/<store>/<section>', methods=['POST'])
@handle_errors
def refresh_scores(store, section):
    """Refresh scores for a store/section and invalidate cache"""
    store_id = str(store)
    section_id = str(section) if section != 'all' else None
    
    # Validate store ID
    if not store_id or store_id == 'undefined':
        return jsonify({
            'success': False,
            'error': 'Invalid store ID'
        }), 400
    
    # Invalidate cache
    cache.delete(f'store_score_{store_id}')
    if section_id:
        cache.delete(f'section_score_{store_id}_{section_id}')
        cache.delete(f'responses_{store_id}_{section_id}')
    else:
        # If section is 'all', invalidate cache for all sections
        sections = ['availability', 'checkout', 'fulfillment', 'people', 'culture']
        for sec in sections:
            cache.delete(f'section_score_{store_id}_{sec}')
            cache.delete(f'responses_{store_id}_{sec}')
    
    # Recalculate scores (they're calculated on-demand, so this is mainly for logging)
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
        'timestamp': datetime.utcnow().isoformat(),
        'cache_invalidated': True
    })

# Debug endpoint to view all stored data
@assessment_bp.route('/debug/storage', methods=['GET'])
@handle_errors
def debug_storage():
    """Debug endpoint to view all stored data"""
    # Return JSON response
    return jsonify({
        'success': True,
        'storage': responses_storage,
        'stores_count': len(responses_storage),
        'timestamp': datetime.utcnow().isoformat()
    })

# Debug endpoint to view cache stats
@assessment_bp.route('/debug/cache', methods=['GET'])
@handle_errors
def debug_cache():
    """Debug endpoint to view cache statistics"""
    # Get cache statistics
    cache_stats = {
        'cache_type': cache.config['CACHE_TYPE'],
        'cache_timeout': cache.config['CACHE_DEFAULT_TIMEOUT'],
        'cache_threshold': cache.config['CACHE_THRESHOLD']
    }
    
    # Return JSON response
    return jsonify({
        'success': True,
        'cache_stats': cache_stats,
        'timestamp': datetime.utcnow().isoformat()
    })

# Debug endpoint to clear cache
@assessment_bp.route('/debug/clear_cache', methods=['POST'])
@handle_errors
def clear_cache():
    """Debug endpoint to clear the cache"""
    # Clear the cache
    cache.clear()
    
    # Return JSON response
    return jsonify({
        'success': True,
        'message': 'Cache cleared successfully',
        'timestamp': datetime.utcnow().isoformat()
    })


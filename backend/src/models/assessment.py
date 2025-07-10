"""
OSR Assessment API Routes
Fixed version with normalized scoring and improved error handling
"""

from flask import Blueprint, request, jsonify
import json
import os
import logging
from datetime import datetime
from typing import Dict, Any, Optional

# Create the blueprint
assessment_bp = Blueprint('assessment', __name__)

# Configure logging
logger = logging.getLogger(__name__)

# In-memory storage for development (replace with database in production)
# Structure: {store_id: {section_id: {question_id-procedure_index: response}}}
responses_storage: Dict[str, Dict[str, Dict[str, Any]]] = {}

# Constants for standardized scoring
STANDARD_POINTS_PER_PROCEDURE = 2
STANDARD_MAX_POINTS_PER_SECTION = {
    'availability': 10,  # 5 questions x 2 points average
    'checkout': 10,      # 5 questions x 2 points average
    'fulfillment': 8,    # 4 questions x 2 points average
    'people': 10,        # 5 questions x 2 points average
    'culture': 8         # 4 questions x 2 points average
}
STANDARD_TOTAL_MAX_POINTS = 46  # Sum of all section standard max points

# Store foundation questions mapping
STORE_FOUNDATIONS = {
    '1660': ['people'],
    '2297': ['fulfillment'],
    '3523': ['fulfillment'],
    '2951': ['people'],
    '5686': ['availability', 'fulfillment', 'checkout']
}

# Helper function to ensure store and section exist in storage
def ensure_storage_structure(store_id: str, section_id: str) -> None:
    """Ensure the storage structure exists for the given store and section"""
    if store_id not in responses_storage:
        responses_storage[store_id] = {}
    if section_id not in responses_storage[store_id]:
        responses_storage[store_id][section_id] = {}

# Helper function to calculate section score with normalization
def calculate_section_score(store_id: str, section_id: str) -> Dict[str, Any]:
    """Calculate the normalized score for a specific section"""
    try:
        if store_id not in responses_storage or section_id not in responses_storage[store_id]:
            return {
                'score': 0,
                'max_score': STANDARD_MAX_POINTS_PER_SECTION.get(section_id, 10),
                'percentage': 0,
                'color': 'red',
                'questions_completed': 0,
                'total_questions': 5,
                'normalized': True
            }
        
        section_responses = responses_storage[store_id][section_id]
        
        # Count total responses and positive responses
        total_responses = len(section_responses)
        positive_responses = sum(1 for resp in section_responses.values() 
                               if isinstance(resp, dict) and resp.get('hasIssues') == 'no')
        
        # Calculate raw score (2 points per positive response)
        raw_score = positive_responses * STANDARD_POINTS_PER_PROCEDURE
        
        # Determine if this section has foundation questions for this store
        has_foundation_questions = (
            store_id in STORE_FOUNDATIONS and 
            section_id in STORE_FOUNDATIONS[store_id]
        )
        
        # Determine total questions based on section and foundation status
        if has_foundation_questions:
            # Sections with foundation questions have more total questions
            if section_id == 'people':
                total_questions = 8  # 5 process check + 3 foundation
            elif section_id == 'availability':
                total_questions = 7  # 4 process check + 3 foundation
            elif section_id == 'fulfillment':
                total_questions = 7  # 4 process check + 3 foundation
            elif section_id == 'checkout':
                total_questions = 8  # 5 process check + 3 foundation
            else:
                total_questions = 5  # Default
        else:
            # Standard sections without foundation questions
            if section_id == 'people':
                total_questions = 5
            elif section_id == 'availability':
                total_questions = 4
            elif section_id == 'fulfillment':
                total_questions = 4
            elif section_id == 'checkout':
                total_questions = 5
            elif section_id == 'culture':
                total_questions = 4
            else:
                total_questions = 5  # Default
        
        # Calculate raw max score (2 points per question)
        raw_max_score = total_questions * STANDARD_POINTS_PER_PROCEDURE
        
        # Get standard max score for this section
        standard_max_score = STANDARD_MAX_POINTS_PER_SECTION.get(section_id, 10)
        
        # Calculate normalization factor
        normalization_factor = standard_max_score / raw_max_score if raw_max_score > 0 else 1
        
        # Normalize the score
        normalized_score = round(raw_score * normalization_factor)
        
        # Calculate percentage based on normalized values
        percentage = round((normalized_score / standard_max_score) * 100) if standard_max_score > 0 else 0
        
        # Determine color based on normalized percentage
        if percentage >= 80:
            color = 'green'
        elif percentage >= 60:
            color = 'yellow'
        else:
            color = 'red'
        
        # Log normalization details for debugging
        if normalization_factor != 1:
            logger.info(f"🔄 NORMALIZED SECTION SCORE - {store_id}/{section_id}: " +
                       f"raw={raw_score}/{raw_max_score}, " +
                       f"normalized={normalized_score}/{standard_max_score}, " +
                       f"factor={normalization_factor}, " +
                       f"percentage={percentage}%")
        
        return {
            'score': normalized_score,
            'raw_score': raw_score,
            'max_score': standard_max_score,
            'raw_max_score': raw_max_score,
            'percentage': percentage,
            'color': color,
            'questions_completed': total_responses,
            'total_questions': total_questions,
            'normalized': True,
            'normalization_factor': normalization_factor
        }
    except Exception as e:
        logger.error(f"Error calculating section score: {e}")
        return {
            'score': 0,
            'max_score': STANDARD_MAX_POINTS_PER_SECTION.get(section_id, 10),
            'percentage': 0,
            'color': 'red',
            'questions_completed': 0,
            'total_questions': 5,
            'normalized': True
        }

# Helper function to calculate store score with normalization
def calculate_store_score(store_id: str) -> Dict[str, Any]:
    """Calculate the normalized overall score for a store"""
    try:
        if store_id not in responses_storage:
            return {
                'overall_score': 0,
                'overall_max_score': STANDARD_TOTAL_MAX_POINTS,
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
        
        # Calculate score for each section
        for section in sections:
            section_score = calculate_section_score(store_id, section)
            section_scores[section] = section_score
            
            total_score += section_score['score']
            total_max_score += section_score['max_score']
            
            if section_score['questions_completed'] > 0:
                sections_completed += 1
        
        # Ensure total max score matches the standard
        if total_max_score != STANDARD_TOTAL_MAX_POINTS:
            logger.warning(f"⚠️ Total max score ({total_max_score}) doesn't match standard ({STANDARD_TOTAL_MAX_POINTS})")
            # Adjust to standard
            total_max_score = STANDARD_TOTAL_MAX_POINTS
        
        # Calculate percentage
        overall_percentage = round((total_score / total_max_score * 100)) if total_max_score > 0 else 0
        
        # Determine overall color
        if overall_percentage >= 80:
            overall_color = 'green'
        elif overall_percentage >= 60:
            overall_color = 'yellow'
        else:
            overall_color = 'red'
        
        return {
            'overall_score': total_score,
            'overall_max_score': total_max_score,
            'overall_percentage': overall_percentage,
            'overall_color': overall_color,
            'sections_completed': sections_completed,
            'total_sections': len(sections),
            'section_scores': section_scores,
            'normalized': True
        }
    except Exception as e:
        logger.error(f"Error calculating store score: {e}")
        return {
            'overall_score': 0,
            'overall_max_score': STANDARD_TOTAL_MAX_POINTS,
            'overall_percentage': 0,
            'overall_color': 'red',
            'sections_completed': 0,
            'total_sections': 5,
            'section_scores': {},
            'normalized': True
        }

@assessment_bp.route('/save_response', methods=['POST'])
def save_response():
    """Save a single assessment response with improved error handling"""
    try:
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
        
        # Calculate updated scores
        section_score = calculate_section_score(store_id, section_id)
        store_score = calculate_store_score(store_id)
        
        # Return JSON response with updated scores
        return jsonify({
            'success': True,
            'message': 'Response saved successfully',
            'store': store_id,
            'section': section_id,
            'question_id': question_id,
            'procedure_index': procedure_index,
            'timestamp': datetime.utcnow().isoformat(),
            'section_score': section_score,
            'store_score': store_score
        })
        
    except Exception as e:
        logger.error(f"Error saving response: {e}")
        # Return JSON error response
        return jsonify({
            'success': False,
            'error': 'Internal server error while saving response',
            'details': str(e)
        }), 500

@assessment_bp.route('/get_responses/<store>/<section>', methods=['GET'])
def get_responses(store, section):
    """Get all responses for a specific store and section with improved error handling"""
    try:
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
        
        # Calculate section score
        section_score = calculate_section_score(store_id, section_id)
        
        # Return JSON response with section score
        return jsonify({
            'success': True,
            'store': store_id,
            'section': section_id,
            'responses': responses,
            'count': len(responses),
            'section_score': section_score,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting responses: {e}")
        # Return JSON error response
        return jsonify({
            'success': False,
            'error': 'Internal server error while getting responses',
            'details': str(e)
        }), 500

@assessment_bp.route('/get_store_score/<store>', methods=['GET'])
def get_store_score(store):
    """Get normalized overall score for a store"""
    try:
        store_id = str(store)
        
        # Validate store ID
        if not store_id or store_id == 'undefined':
            return jsonify({
                'success': False,
                'error': 'Invalid store ID'
            }), 400
        
        # Calculate store score with normalization
        score = calculate_store_score(store_id)
        
        logger.info(f"Calculated store score for {store_id}: {score['overall_percentage']}%")
        
        # Return JSON response with normalized score
        return jsonify({
            'success': True,
            'store': store_id,
            'score': score,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting store score: {e}")
        # Return JSON error response
        return jsonify({
            'success': False,
            'error': 'Internal server error while getting store score',
            'details': str(e)
        }), 500

@assessment_bp.route('/get_section_score/<store>/<section>', methods=['GET'])
def get_section_score(store, section):
    """Get normalized score for a specific section"""
    try:
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
        
        # Calculate section score with normalization
        score = calculate_section_score(store_id, section_id)
        
        logger.info(f"Calculated section score for {store_id}-{section_id}: {score['percentage']}%")
        
        # Return JSON response with normalized score
        return jsonify({
            'success': True,
            'store': store_id,
            'section': section_id,
            'score': score,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting section score: {e}")
        # Return JSON error response
        return jsonify({
            'success': False,
            'error': 'Internal server error while getting section score',
            'details': str(e)
        }), 500

@assessment_bp.route('/refresh_scores/<store>/<section>', methods=['POST'])
def refresh_scores(store, section):
    """Force refresh of scores for a store or section"""
    try:
        store_id = str(store)
        section_id = str(section)
        
        # Validate store ID
        if not store_id or store_id == 'undefined':
            return jsonify({
                'success': False,
                'error': 'Invalid store ID'
            }), 400
        
        # Refresh all sections if section is 'all'
        if section_id == 'all':
            score = calculate_store_score(store_id)
            logger.info(f"Refreshed all scores for store {store_id}")
            
            return jsonify({
                'success': True,
                'store': store_id,
                'score': score,
                'message': 'All scores refreshed successfully',
                'timestamp': datetime.utcnow().isoformat()
            })
        else:
            # Refresh specific section
            section_score = calculate_section_score(store_id, section_id)
            store_score = calculate_store_score(store_id)
            
            logger.info(f"Refreshed scores for {store_id}-{section_id}")
            
            return jsonify({
                'success': True,
                'store': store_id,
                'section': section_id,
                'section_score': section_score,
                'store_score': store_score,
                'message': 'Section score refreshed successfully',
                'timestamp': datetime.utcnow().isoformat()
            })
        
    except Exception as e:
        logger.error(f"Error refreshing scores: {e}")
        # Return JSON error response
        return jsonify({
            'success': False,
            'error': 'Internal server error while refreshing scores',
            'details': str(e)
        }), 500

@assessment_bp.route('/health', methods=['GET'])
def health_check():
    """Enhanced health check endpoint with storage stats"""
    try:
        # Get storage stats
        store_count = len(responses_storage)
        total_responses = sum(
            len(section_data)
            for store_data in responses_storage.values()
            for section_data in store_data.values()
        )
        
        return jsonify({
            'success': True,
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'service': 'OSR Assessment API',
            'version': '1.1.0',
            'storage_stats': {
                'stores': store_count,
                'total_responses': total_responses
            }
        })
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500


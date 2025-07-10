#!/usr/bin/env python3
"""
WSGI entry point for the OSR Assessment Tool backend
"""
import os
import sys

# Add the current directory to the Python path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Add the src directory to the Python path
SRC_DIR = os.path.join(BASE_DIR, 'src')
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

# Import the Flask app from main.py
from src.main import app as application

# Alias for Gunicorn
app = application

if __name__ == "__main__":
    # This block is only executed when running this file directly
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)


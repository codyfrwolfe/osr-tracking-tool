#!/usr/bin/env python3
"""
Test script for the WSGI application
"""
import os
import sys
import requests

def test_wsgi_locally():
    """Test the WSGI application locally"""
    print("Testing WSGI application locally...")
    
    # Import the app from wsgi.py
    from wsgi import app
    
    # Start the app in a separate thread
    import threading
    import time
    
    def run_app():
        app.run(host="0.0.0.0", port=8080)
    
    thread = threading.Thread(target=run_app)
    thread.daemon = True
    thread.start()
    
    # Wait for the app to start
    time.sleep(2)
    
    # Test the health endpoint
    try:
        response = requests.get("http://localhost:8080/api/health")
        print(f"Status code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Health check passed!")
        else:
            print("❌ Health check failed!")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    # Stop the app
    print("Test complete.")

if __name__ == "__main__":
    test_wsgi_locally()


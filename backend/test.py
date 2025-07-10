#!/usr/bin/env python3
"""
Test script for the OSR Assessment Tool backend
"""

import requests
import time
import subprocess
import sys
import os

def test_app():
    """Test the application locally"""
    print("Starting the application...")
    
    # Start the application in the background
    process = subprocess.Popen(
        ["python", "app.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Wait for the application to start
    time.sleep(2)
    
    # Test the health check endpoint
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
    
    # Stop the application
    process.terminate()
    process.wait()
    
    print("Test complete.")

if __name__ == "__main__":
    test_app()


#!/usr/bin/env python3
"""
Simple HTTP Server for testing the Electrical Engineering Curriculum Visualization

Usage:
    python3 server.py

The server will start on localhost:8000 by default
"""

import http.server
import socketserver
import webbrowser
from urllib.parse import urlparse
import os
import sys

# Configuration
PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
        
    def log_request(self, code='-', size='-'):
        # Custom logging format
        if isinstance(code, http.client.HTTPStatus):
            code = code.value
        path = urlparse(self.path).path
        print(f"{self.date_time_string()} [{code}] {self.command} {path}")
        
    def end_headers(self):
        # Add CORS headers to allow local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type')
        super().end_headers()

def start_server():
    handler = CustomHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        print("Press Ctrl+C to stop the server")
        
        # Open browser automatically
        webbrowser.open(f"http://localhost:{PORT}/index.html")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            httpd.shutdown()
            sys.exit(0)

if __name__ == "__main__":
    start_server()

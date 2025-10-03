#!/usr/bin/env python3
"""
Setup script for AI Chat API
This script helps set up the environment and dependencies
"""

import os
import subprocess
import sys

def create_env_file():
    """Create .env file with default values"""
    env_content = """# AI Chat API Environment Variables
# Update these values with your actual API keys

# API Configuration
API_KEY=supersecretapikey
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# AWS Configuration (for DynamoDB)
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1
DYNAMODB_TABLE_PREFIX=ai-chat

# AI Model API Keys
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration
DATABASE_URL=sqlite:///./ai_chat.db
"""
    
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if not os.path.exists(env_path):
        with open(env_path, 'w') as f:
            f.write(env_content)
        print(f"Created .env file at {env_path}")
        print("Please update the .env file with your actual API keys")
    else:
        print(".env file already exists")

def install_dependencies():
    """Install Python dependencies"""
    try:
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'], check=True)
        print("Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"Error installing dependencies: {e}")
        return False
    return True

def main():
    """Main setup function"""
    print("Setting up AI Chat API...")
    
    # Create .env file
    create_env_file()
    
    # Install dependencies
    if install_dependencies():
        print("\nSetup complete!")
        print("\nNext steps:")
        print("1. Update the .env file with your actual API keys")
        print("2. Run: python start.py")
    else:
        print("Setup failed. Please check the error messages above.")

if __name__ == "__main__":
    main()

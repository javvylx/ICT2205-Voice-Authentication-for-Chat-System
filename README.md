# ict2205-crypto_pt2

## Flask-based Chat service 
Requirements:

    conda install --file conda_requirements.txt
    pip install -r requirements.txt
    
Install Model

    Download 'vosk-model-en-us-aspire-0.2' from here: https://alphacephei.com/vosk/models
    Create a folder named 'model'
    Extract all contents from 'vosk-model-en-us-aspire-0.2' to 'model'

To run in Windows
    
    On your CMD
    set FLASK_APP=<your_file_path\webapp> (E.g set FLASK_APP=C:\Users\chinb\Documents\GitHub\ict2205-crypto_pt2\webapp)
    set FLASK_ENV=development (if you want, default is "production")
    flask run

To access webapp

    http://127.0.0.1:5000

## What is done
- Basic Flask infrastructure
    - Local login 
    - Error handling / Session Management
- Simple chat room capabilities with messages
    - Create chat room option
    - Join chat room option
    - Password authentication to enter room (in plain text currently)
    - Error handling / session management for chat room
- Standalone Voice Authentication -- BH/KK (~~Integration in the process~~ , Testing)
    - User can register with voice/speech
    - Voice and speech will be checked before creating/joining a room
    - All voice/speech data uploaded to firebase realtime database
    - Error handling for voice/speech authentication
- Integration with Firebase for login/registration
- Receive voice input through browser

## TBD
- Voice Chat capability in room 
- Encryption for both text message and voice message

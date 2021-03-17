# ict2205-crypto_pt2

## Flask-based Chat service 
Before running webapp

    pip install -r requirements.txt

To run in Windows

    set FLASK_APP = <webapp-dir>
    set FLASK_ENV = development (if you want, default is "production")
    run flask

To run in Linux

    export FLASK_APP = <webapp-dir>
    export FLASK_ENV = development (if you want, default is "production")
    run flask

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
- Standalone Voice Authentication -- BH/KK (To be integrated)
- Standalone Login/Registration -- Javier (To be integrated)

## TBD
- Integration with Firebase for login/registration
- Voice Authentication before entering room
- Voice Chat capability in room
- Encryption for both text message and voice message

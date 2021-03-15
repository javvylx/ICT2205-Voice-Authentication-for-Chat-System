# ict2205-crypto_pt2

## Flask-based Chat service 

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
- Session Management
- Simple chat room capabilities with messages
- Error Handling for chat room
- Standalone Voice Authentication -- BH/KK (To be integrated)
- Standalone Login/Registration -- Javier (To be integrated)

## TBD
- Integration with Firebase for login/registration
- Voice Authentication before entering room
- Voice Chat capability in room
- Encryption for both text message and voice message

# ict2205-crypto_pt2

## Flask-based Chat service 

https://www.sitict2205tefr.ga/

## What is done
- Basic Flask infrastructure
    - Local login 
    - Error handling / Session Management
- Chat room capabilities
    - Create chat room option
    - Join chat room option
    - Password authentication to enter room 
    - Error handling / session management for chat room
- Room Management
    - Unique room
    - Auto destroy room 
    - Key management
- Standalone Voice Authentication 
    - User can register with voice/speech
    - Voice and speech will be checked before creating/joining a room
    - All voice/speech data uploaded to firebase realtime database
    - Error handling for voice/speech authentication
- End to End Encryption (E2EE)
    - AES-256
    - Able to encrypt and decrypt audio chunks and message data
- Integration with Firebase for login/registration
- Receive voice input through browser
- Cloud deployment with flask integration

## Things to note
- VOSK model is not included within the repository
    - The model can be found in [here](https://alphacephei.com/vosk/models).
    - ![VOSK Model](https://ibb.co/r3sHyQJ)



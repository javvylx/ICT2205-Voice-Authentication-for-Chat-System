# SIT ICT 2205 (Applied Cryptography) - 

## Flask-based Voice Authentication for Chat System 

https://www.sitict2205tefr.ga/

<a href="http://www.youtube.com/watch?feature=player_embedded&v=Mo9DIKBwglE" target="_blank"><img src="https://i9.ytimg.com/vi/Mo9DIKBwglE/mqdefault.jpg?time=1618074600000&sqp=COi3x4MG&rs=AOn4CLAqVUdI93EDRQHJsxDPN_S8PKRDJg" alt="ICT2205 - TeamEggFriedRice Voice Authentication System" width="240" height="180" border="10" /></a>

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
- Cloud deployment
    - SSL/TLS deployment
    - Flask deployment

## Things to note
- VOSK model is not included within the repository
    - The model can be found in [here](https://alphacephei.com/vosk/models).
    - ![VOSK Model](https://i.ibb.co/xYH652Q/unknown.png)



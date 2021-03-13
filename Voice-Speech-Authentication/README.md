# Voice-Authentication-CNN
A simple Voice Authentication system using pre-trained Convolutional Neural Network.


# Installing
Python Package
``pip install -r requirements.txt``
Non python Package (conda_requirements.txt)
``conda install -c anaconda pyaudio``


# Enrolled Audio:
* BH - BHBixby.wav (BingHong)
* CC - CCBixby.wav (Claudia)
* JL - JLBixby.wav (Javier)
* KK - KKBixby.wav (KaiKeng)


## Enrollment:
Enroll a new user using an audio file of his/her voice

``python voice_auth.py -t enroll -n "name of person" -f "audio.wav"``

 
## Recognition:
Authenticate a user if it matches voice prints saved on the disk

``python voice_auth.py -t recognize -f "audio.wav"``



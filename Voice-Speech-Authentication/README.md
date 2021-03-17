# Voice-Authentication-CNN
A simple Voice Authentication system using pre-trained Convolutional Neural Network.


# Installing
Python Package
``pip install -r requirements.txt``
Non python Package (conda_requirements.txt)
``conda install -c anaconda pyaudio``
Downloading and extracting speech model
1. Go to "Project - Part 2/model" in Gdrive
2. Download "vosk-model-en-us-aspire-0.2.zip"
3. Extract the content inside the folder into github /model folder (If there is not /model folder, create it)
4. Ensure there are 5 folders in /model


# Enrolled Audio (under /audio):
* BH - BHBixby.wav (BingHong)
* CC - CCBixby.wav (Claudia)
* JL - JLBixby.wav (Javier)
* KK - KKBixby.wav (KaiKeng)


## Enrollment :
Enroll a new user using an audio file of his/her voice

``python server.py -t enroll -n "name of person" -f "audio.wav"``

 
## Recognition :
Authenticate a user if it matches voice prints saved on the disk

``python server.py -t recognize -n "name of person" -f "audio.wav"``



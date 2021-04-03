import json
import requests
import pyrebase
from flask import Blueprint, render_template, redirect, url_for, request, session
from flask_session import Session
from . import fBaseAuth
import voice_speech_authentication.parameters as p
from vosk import Model, KaldiRecognizer, SetLogLevel
from keras.models import load_model
# from .helper import isAuthenticated
# from helper import isAuthenticated


auth = Blueprint('auth', __name__)


class class_models:
    def __init__(self, speech_model, voice_model):
        self.speech_model = speech_model
        self.voice_model = voice_model

speech_model = Model("model")
voice_model = load_model(p.MODEL_FILE)
model = class_models(speech_model, voice_model)

# Route to handle login
@auth.route('/login', methods=['GET', 'POST'])
def login():

    # Check if user is authenticated
    if session.get('email') is not None:
        return redirect(url_for('app.chat'))

    # Initalising an empty error msg
    error = None

    # Getting data from post form
    if request.method == 'POST':
        email = request.form['username']
        password = request.form['password']
        try:
            userInfo = fBaseAuth.sign_in_with_email_and_password(email, password)
            accInfo = fBaseAuth.get_account_info(userInfo['idToken'])
            session['email'] = accInfo['users'][0]['email']
            return redirect(url_for('app.chat'))
        except:
            error = 'Please check your credentials'

    return render_template('login.html', error = error)

# Route to handle logout 
@auth.route('/logout')
def logout():

    # If session exists clear it
    if session.get('email') is not None:
        session.clear()
    else:
        return redirect(url_for('auth.login'))

    return redirect(url_for('app.home'))

# Route to handle register
@auth.route('/register', methods=['GET', 'POST'])
def register():
    if (request.method == 'POST'):
        email = request.form['name']
        password = request.form['password']
        
        try:
            fBaseAuth.create_user_with_email_and_password(email, password)
            print(email)
            return render_template('index.html')
        except requests.exceptions.HTTPError as e:
          error_json = e.args[1]
          error = json.loads(error_json)['error']['message']
        
        print(email)
        """
        @TODO
        @BH Add upload voice to firebase here
        """
        from pathlib import Path
        import os
        from app import app
        from voice_speech_authentication import server as vsauth
        entries = os.listdir('app\\static\\_files')
        # audio_file = app.return_idfile()
        path = Path(os.path.join('app\\static\\_files\\', entries[0]))
        root_path = path.parent.absolute()
        audio_path = os.path.join(str(root_path), entries[0])
        print(root_path)
        speech = app.return_speech()
        # speech = vsauth.speech_recognize(audio_path)
        print("EMAIL: ", email)
        vsauth.enroll(email, audio_path, speech)
        # speech = vsauth.speech_recognize(audio_file)
        print(speech)
        entries = os.listdir('app\\static\\_files')
        if len(entries) > 0:
            for i in entries:
                os.remove(os.path.join('app\\static\\_files\\', i))
        return render_template('create_account.html', error = error)


    return render_template('create_account.html')
    
@auth.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    if (request.method == 'POST'):
            email = request.form['name']
            fBaseAuth.send_password_reset_email(email)
            return render_template('index.html')
    return render_template('forgetpwd.html')  
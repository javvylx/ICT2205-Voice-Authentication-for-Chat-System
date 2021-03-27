import json
import pyrebase
from flask import render_template, request, redirect, session
from app import app
import voice_speech_authentication.parameters as p
from vosk import Model, KaldiRecognizer, SetLogLevel
from keras.models import load_model
import os

with open('app/ict2205_configkey.json') as json_file:
    apikey = json.load(json_file)

firebase = pyrebase.initialize_app(apikey)
auth = firebase.auth()

class class_models:
    def __init__(self, speech_model, voice_model):
        self.speech_model = speech_model
        self.voice_model = voice_model

speech_model = Model("model")
voice_model = load_model(p.MODEL_FILE)
model = class_models(speech_model, voice_model)

@app.route('/')
@app.route('/index', methods=['GET', 'POST'])
def index():
    if (request.method == 'POST'):
            email = request.form['name']
            password = request.form['password']
            try:
                auth.sign_in_with_email_and_password(email, password)
                #user_id = auth.get_account_info(user['idToken'])
                #session['penis'] = user_id 
                # TO DO later????
                # Session Handling
                return render_template('dashboard.html')
            except:
                unsuccessful = 'Please check your credentials'
                return render_template('index.html', umessage=unsuccessful)
    return render_template('index.html')

@app.route('/create_account', methods=['GET', 'POST']) 
def create_account():
    if (request.method == 'POST'):
            email = request.form['name']
            password = request.form['password']
            auth.create_user_with_email_and_password(email, password)
            return render_template('index.html')
    return render_template('create_account.html')

@app.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    if (request.method == 'POST'):
            email = request.form['name']
            auth.send_password_reset_email(email)
            return render_template('index.html')
    return render_template('forgot_password.html')


if __name__ == '__main__':
    app.run()

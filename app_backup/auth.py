import json
import pyrebase
from flask import Blueprint, render_template, redirect, url_for, request, session
from flask_session import Session
from __init__ import fBaseAuth
# from .helper import isAuthenticated
# from helper import isAuthenticated



auth = Blueprint('auth', __name__)

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
            #user_id = auth.get_account_info(user['idToken'])
            #session['penis'] = user_id 
            # TO DO later????
            # Session Handling
            # print(accInfo['users'][0]['email'])
            session['email'] = accInfo['users'][0]['email']
            # session['email'] = fBaseAuth.get_account_info(user['email'])
            # fBaseAuth.get_account_info()
            # print(user)
            # print(fBaseAuth.get_account_info(user['idToken']))
            # print(session)
            return redirect(url_for('app.chat'))
        except:
            error = 'Please check your credentials'
            # return render_template('index.html', umessage=unsuccessful)

        # if request.form['username'] != 'admin' or request.form['password'] != 'admin':
            
        #     # Return error message
        #     error = 'Invalid Credentials. Please try again.'
        
        # else:
            
        #     # Create a session for the user
        #     session['username'] = request.form['username']
        #     print(session)
        #     return redirect(url_for('app.chat'))
    
        # if request.form['username'] != 'qwe' or request.form['password'] != 'qwe':
            
        #     # Return error message
        #     error = 'Invalid Credentials. Please try again.'
        
        # else:
            
        #     # Create a session for the user
        #     session['username'] = request.form['username']
        #     return redirect(url_for('app.chat'))

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
        fBaseAuth.create_user_with_email_and_password(email, password)
        print(email)
        """
        @TODO
        @BH Add upload voice to firebase here
        """
        from pathlib import Path
        import os
        from webapp import app
        from voice_speech_authentication import server as vsauth
        entries = os.listdir('webapp\\static\\_files')
        # audio_file = app.return_idfile()
        path = Path(os.path.join('webapp\\static\\_files\\', entries[0]))
        root_path = path.parent.absolute()
        audio_path = os.path.join(str(root_path), entries[0])
        print(root_path)
        speech = app.return_speech()
        # speech = vsauth.speech_recognize(audio_path)
        print("EMAIL: ", email)
        vsauth.enroll(email, audio_path, speech)
        # speech = vsauth.speech_recognize(audio_file)
        print(speech)
        entries = os.listdir('webapp\\static\\_files')
        if len(entries) > 0:
            for i in entries:
                os.remove(os.path.join('webapp\\static\\_files\\', i))
        return render_template('index.html')

    return render_template('create_account.html')
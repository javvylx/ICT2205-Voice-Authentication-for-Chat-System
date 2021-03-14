import pyrebase
from flask import render_template, request, redirect, session
from app import app
import os

config = {
    "apiKey": "AIzaSyAftEUeqo1r_Mb2F8TXWj2SfSVNa0qt-ss",
    "authDomain": "ict2205pt2.firebaseapp.com",
    "databaseURL": "https://ict2205pt2-default-rtdb.firebaseio.com",
    "projectId": "ict2205pt2",
    "storageBucket": "ict2205pt2.appspot.com",
    "messagingSenderId": "541953920391",
    "appId": "1:541953920391:web:50a639e519fea1d4315722"
}

firebase = pyrebase.initialize_app(config)
auth = firebase.auth()

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

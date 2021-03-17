from flask import Blueprint, render_template, redirect, url_for, request, session
from flask_session import Session
# from .helper import isAuthenticated
# from helper import isAuthenticated

auth = Blueprint('auth', __name__)

# Route to handle login
@auth.route('/login', methods=['GET', 'POST'])
def login():

    # Check if user is authenticated
    if session.get('username') is not None:
        return redirect(url_for('app.chat'))

    # Initalising an empty error msg
    error = None

    # Getting data from post form
    if request.method == 'POST':
        
        if request.form['username'] != 'admin' or request.form['password'] != 'admin':
            
            # Return error message
            error = 'Invalid Credentials. Please try again.'
        
        else:
            
            # Create a session for the user
            session['username'] = request.form['username']
            print(session)
            return redirect(url_for('app.chat'))
    
        if request.form['username'] != 'qwe' or request.form['password'] != 'qwe':
            
            # Return error message
            error = 'Invalid Credentials. Please try again.'
        
        else:
            
            # Create a session for the user
            session['username'] = request.form['username']
            return redirect(url_for('app.chat'))

    return render_template('login.html', error = error)

# Route to handle logout
@auth.route('/logout')
def logout():

    # If session exists clear it
    if session.get('username') is not None:
        session.clear()
    else:
        return redirect(url_for('auth.login'))

    return redirect(url_for('app.home'))

# Route to handle register
@auth.route('/register', methods=['GET', 'POST'])
def register():
    
    # to be done
    return None
    # error = None
    
    # if 'username' in session:
    #     return redirect(url_for('home'))

    # if request.method == 'POST':
        
    #     if request.form['username'] != 'admin' or request.form['password'] != 'admin':
    #         error = 'Invalid Credentials. Please try again.'
        
    #     else:
    #         session['username'] = request.form['username']
    #         return redirect(url_for('auth.success'))
    
    # return render_template('login.html', error=error)

# def isAuthenticated():
#     print(session)
#     if session.get('username') is not None:
#         print(session.get('username'))
#         return redirect(url_for('app.chat'))
#     else:
#         print("in here")
#         return redirect(url_for('auth.login'))
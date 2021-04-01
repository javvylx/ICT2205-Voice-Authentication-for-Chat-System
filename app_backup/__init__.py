import json
import pyrebase
from flask import Flask
# from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from flask_session import Session
from waitress import serve

<<<<<<< HEAD
with open('ict2205_configkey.json') as json_file:
    apikey = json.load(json_file)

# Initalising socketIO
socketio = SocketIO()
=======



app = Flask(__name__)


from app import routes
>>>>>>> 08a2879597a1f4f090308a7e0cf4567787996914

# init SQLAlchemy so we can use it later in our models
# db = SQLAlchemy()

firebase = pyrebase.initialize_app(apikey)
fBaseAuth = firebase.auth()

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'secret-key-goes-here'
    app.config['SESSION_TYPE'] = 'filesystem'
    Session(app)

    # app.secret_key = 'secret-key-goes-here'
    # app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite'

    # db.init_app(app)

    # blueprint for auth routes in our app
    from auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)

    # blueprint for non-auth parts of app
    from app import app as app_blueprint
    app.register_blueprint(app_blueprint)

    

    # Linking socketio with app
    socketio.init_app(app,manage_session=False)

    serve(app, host='127.0.0.1', port=5000, url_scheme='https')
    return app

if __name__ == '__main__':
    create_app().run
import json
import pyrebase
from flask import Flask
# from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from flask_session import Session

with open('app/ict2205_configkey.json') as json_file:
    apikey = json.load(json_file)

# Initalising socketIO
socketio = SocketIO()

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
    from .auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)

    # blueprint for non-auth parts of app
    from .app import app as app_blueprint
    app.register_blueprint(app_blueprint)

    

    # Linking socketio with app
    socketio.init_app(app,manage_session=False)

    return app
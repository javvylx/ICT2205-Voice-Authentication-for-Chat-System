from flask import Flask, render_template, session, request, copy_current_request_context, url_for
from flask_socketio import SocketIO, emit, join_room, leave_room, close_room, rooms, disconnect
import os
import uuid
import wave
import array


app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, binary=True)

@app.route("/")
def index():
    return render_template('main.html')

""""""

@socketio.on('send')
def send(data):
    # emit('voice', data, broadcast=True, include_self=False)
    print(data)
    emit('voice', data)


if __name__ == '__main__':
    socketio.run(app)
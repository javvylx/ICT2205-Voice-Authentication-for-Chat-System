from flask import Flask, render_template, session, request, copy_current_request_context, url_for
from flask_socketio import SocketIO, emit, join_room, leave_room, close_room, rooms, disconnect
import os
import uuid
import wave


app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

@app.route("/")
def index():
    return render_template('main.html')

@socketio.on('start-recording')
def start_recording(options):
    id = uuid.uuid4().hex
    # Server-side filename
    global idfile
    idfile = id + '.wav'
    """Start recording audio from the client."""
    # Write .WAV to ./static/_files
    filename = os.path.join(app.root_path, 'static\\_files\\', idfile)
    wf = wave.open(filename, 'wb')
    # Set number of audio channels
    wf.setnchannels(options.get('numChannels', 1))
    # Set sample width bytes
    wf.setsampwidth(options.get('bps', 16) // 8)
    # Set frame rate
    wf.setframerate(options.get('fps', 44100))
    idfile = wf

""""""
@socketio.on('write-audio')
def write_audio(data):
    # Write a chunk of audio from the client
    idfile.writeframesraw(data)

# """Client stop recording audio"""
@socketio.on('end-recording')
def end_recording():
    # Close wave file
    idfile.close()

if __name__ == '__main__':
    socketio.run(app)
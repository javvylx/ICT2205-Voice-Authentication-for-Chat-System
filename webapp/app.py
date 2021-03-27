import uuid
import wave
import os
from flask import Blueprint, render_template, redirect, url_for, session, request
from flask_socketio import join_room, leave_room, emit
from flask_session import Session
# from .helper import isAuthenticated
from . import socketio
from pathlib import Path
from voice_speech_authentication.server import speech_recognize, recognize

app = Blueprint('app', __name__)

# Initalising an empty dict & array
existRm = {}
usersOnlineDisplayNames = []


# Route for default page
@app.route('/')
def home():
    return render_template('index.html')


# Route to show voice chat
@app.route('/chat', methods=['GET', 'POST'])
def chat():
    # Check if user is authenticated
    if session.get('email') is None:
        return redirect(url_for('auth.login'))

    # Initalising an empty error msg
    error = None

    # Getting data from create-room form
    if (request.method == 'POST' and "create-room" in request.form):

        # Getting relevant information from form
        room = request.form['create-room']
        passwd = request.form['pass-create-room']

        """    
        @TODO
        BH Pefrom voice validation here, pref return true/false.
        Need to add if statement to check for the return value 
        from voice validation function
        """
        entries = os.listdir('webapp\\static\\_files')
        # audio_file = app.return_idfile()
        try:
            path = Path(os.path.join('webapp\\static\\_files\\', entries[0]))
            root_path = path.parent.absolute()
            audio_path = os.path.join(str(root_path), entries[0])
            result = recognize(email=session.get('email'), file=audio_path)
            if len(entries) > 0:
                for i in entries:
                    os.remove(os.path.join('webapp\\static\\_files\\', i))

            # Checking if a room with same name exists and if voice/speech recgonition is successful
            if result == True and room not in existRm:
                # Store the room data in session
                session['room'] = room

                # creating a dict for new rooms
                existRm[room] = {}
                existRm[room]['password'] = passwd
                existRm[room]['numUser'] = 1

                # Append username to online users in room
                usersOnlineDisplayNames.append(session.get('email'))

                return redirect(url_for('app.chat_room'))
            elif result == False:
                # Return error message
                error = 'Unidentified voice. Please try again.'

            else:
                # Return error message
                error = 'Room already exists'
        except:
            error = 'Please record your voice for authentication before creating room.'

    # Getting data from join-room form
    if (request.method == 'POST' and "join-room" in request.form):

        # Getting relevant information from form
        room = request.form['join-room']
        passwd = request.form['pass-join-room']

        """
        @TODO
        @BH Pefrom voice validation here, pref return true/false
        Add it to the existing if check directly below
        """
        entries = os.listdir('webapp\\static\\_files')
        # audio_file = app.return_idfile()
        try:
            path = Path(os.path.join('webapp\\static\\_files\\', entries[0]))

            root_path = path.parent.absolute()
            audio_path = os.path.join(str(root_path), entries[0])
            result = recognize(email=session.get('email'), file=audio_path)
            if len(entries) > 0:
                for i in entries:
                    os.remove(os.path.join('webapp\\static\\_files\\', i))

            # Check if room exist & password is correct
            if room in existRm and existRm[room]['password'] == passwd and result == True:

                # Store the room data in session
                session['room'] = room

                # Increment number of user in a room & include new username
                existRm[room]['numUser'] += 1

                # Append username to online users in room
                usersOnlineDisplayNames.append(session.get('email'))

                return redirect(url_for('app.chat_room'))

            elif result == False:
                # Return error message
                error = 'Unidentified voice. Please try again.'

            else:
                # Return error message
                error = 'Room does not exist or password is wrong'
        except:
            error = 'Please record your voice for authentication before joining room.'

    return render_template('chat.html', error=error)


@app.route('/chat_room', methods=['GET', 'POST'])
def chat_room():
    # Check if user is authenticated
    if session.get('email') is None:
        return redirect(url_for('auth.login'))

    return render_template('chat_room.html')


@socketio.on('join', namespace='/chat')
def join(message):
    room = session.get('room')
    email = session.get('email')
    join_room(room)
    emit('status', ({'msg': session.get('email') + ' has entered the room.'}), room=room)
    emit('updateOnlineUser', ({'user': usersOnlineDisplayNames, 'newUser': email}), room=room)


@socketio.on('text', namespace='/chat')
def text(message):
    room = session.get('room')
    print(session)
    emit('message', {'msg': session.get('email') + ' : ' + message['msg']}, room=room)


@socketio.on('left', namespace='/chat')
def left(message):
    room = session.get('room')
    email = session.get('email')
    leave_room(room)

    # Remove username from online user in room
    usersOnlineDisplayNames.remove(email)

    # Decrement number of user in a room
    existRm[room]['numUser'] -= 1

    # Remove room from dict if number of users reaches 0
    if existRm[room]['numUser'] == 0:
        existRm.pop(room)

    # Remove room from session
    session.pop('room', None)

    emit('status', {'msg': email + ' has left the room.', 'user': email}, room=room)
    emit('deleteOnlineUser', email, room=room)


@socketio.on('start-recording')
def start_recording(options):
    entries = os.listdir('webapp\\static\\_files')
    if len(entries) > 0:
        for i in entries:
            os.remove(os.path.join('webapp\\static\\_files\\', i))
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


@socketio.on('confirmation')
def confirm_recording():
    global speech
    entries = os.listdir('webapp\\static\\_files')
    path = Path(os.path.join('webapp\\static\\_files\\', entries[0]))
    root_path = path.parent.absolute()
    audio_path = os.path.join(str(root_path), entries[0])
    print("IDFILE: ", idfile)
    speech = speech_recognize(audio_path)
    print(speech)
    emit('confirmspeech', speech)


def return_speech():
    try:
        return speech
    except:
        print("There is no speech to be returned!")


def return_idfile():
    try:
        return idfile
    except:
        print("Did not record!")
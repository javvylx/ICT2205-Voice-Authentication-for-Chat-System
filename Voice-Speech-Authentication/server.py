import os
import firebase_admin
import pyrebase
import json
import numpy as np
from keras.models import load_model
import voice_speech_authentication.parameters as p
from voice_speech_authentication.feature_extraction  import get_embedding, get_embeddings_from_list_file
from scipy.spatial.distance import cdist, euclidean, cosine
from vosk import Model, KaldiRecognizer, SetLogLevel
from pydub import AudioSegment
import wave
import argparse
from silence_tensorflow import silence_tensorflow
from pathlib import Path
silence_tensorflow()

def initialise_fdb():
    with open('app/ict2205_configkey.json') as json_file:
        apikey = json.load(json_file)
    firebase = pyrebase.initialize_app(apikey)
    db = firebase.database()
    return db

def speech_recognize(file):
    SetLogLevel(-1)

    if not os.path.exists("model"):
        print ("Please download the model from https://alphacephei.com/vosk/models and unpack as 'model' in the current folder.")
        exit (1)

    sound = AudioSegment.from_wav(file)
    sound = sound.set_channels(1)
    sound.export(p.AUDIO_FILE + "/sound.wav", format="wav")

    wf = wave.open(p.AUDIO_FILE+"/sound.wav", "rb")
    if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getcomptype() != "NONE":
        print ("Audio file must be WAV format mono PCM.")
        exit (1)

    model = Model("model")
    rec = KaldiRecognizer(model, wf.getframerate())

    while True:
        data = wf.readframes(4000)
        if len(data) == 0:
            break
        if rec.AcceptWaveform(data):
            result = rec.Result()
            result2 = json.loads(result)
        else:
            rec.PartialResult()

    try:
        return result2["text"]
    except:
        result1 = json.loads(rec.FinalResult())
        return result1["text"]

def enroll(name, file):
    """Enroll a user with an audio file
        inputs: str (Name of the person to be enrolled and registered)
                str (Path to the audio file of the person to enroll)
        outputs: None"""

    print("Loading model weights from [{}]....".format(p.MODEL_FILE))
    try:
        model = load_model(p.MODEL_FILE)
    except:
        print(
            "Failed to load weights from the weights file, please ensure *.pb file is present in the MODEL_FILE directory")
        exit()

    # data = {name: {'file_name': file_name, 'Speech': "bigggggg"}}
    print("Processing enroll sample....")
    enroll_result = get_embedding(model, file, p.MAX_SEC)
    speech = speech_recognize(file)
    # enroll_embs = np.array(enroll_result.tolist())
    # speaker = name
    file_name = name + ".npy"
    data = {name: {'file_name': file_name, 'NPY_file': enroll_result.tolist(), 'Speech': speech}}
    try:

        json.dumps(data, indent=4)
    except:
        print("Error processing the input audio file. Make sure the path.")

    try:
        print("Uploading to database")
        db = initialise_fdb()
        print("NAME: ",name)
        db.child(name).set(data)
        print("Succesfully enrolled the user")
    except:
        print("Unable to save the user into the database.")

def recognize(email, file):
    """Recognize the input audio file by comparing to saved users' voice prints
        inputs: str (Path to audio file of unknown person to recognize)
        outputs: str (Name of the person recognized)"""

    db = initialise_fdb()
    user = email.split("@")[0]
    try:
        fb_data = db.child(user).get()
    except:
        print("email does not exist!")
    fb_speech = db.child(user).child('Speech').get().val()
    user_speech = speech_recognize(file)
    print("FB_SPEECH: ",fb_speech)
    print("USER_SPEECH: ", user_speech)

    if fb_data == None:
        print ("Voice does not exist!")
        return False

    if fb_speech != user_speech:
        print ("Unknown speech! Please try again!")
        return False

    print("Loading model weights from [{}]....".format(p.MODEL_FILE))

    try:
        model = load_model(p.MODEL_FILE)

    except:
        print(
            "Failed to load weights from the weights file, please ensure *.pb file is present in the MODEL_FILE directory")
        exit()

    distances = {}
    print("Processing test sample....")
    print("Comparing test sample against enroll samples....")
    test_result = get_embedding(model, file, p.MAX_SEC)
    test_embs = np.array(test_result.tolist())


    all_data = db.child().get()
    for name in all_data.val():

        speech_data = db.child(name).child("Speech").get().val()
        if speech_data == user_speech:
            print("NAME: ", name)
            npy_data = db.child(name).child("NPY_file").get().val()
            distance = euclidean(test_embs, npy_data)
            distances.update({name: distance})


    if min(list(distances.values())) < p.THRESHOLD:
        predicted_name = min(distances, key=distances.get)
        print("Recognized: ", predicted_name)
    else:
        print("Could not identify the user, try enrolling again with a clear voice sample")
        print("Score: ", min(list(distances.values())))
        return False

    if predicted_name==user:
        return True
    else:
        return False

def args():
    parser = argparse.ArgumentParser()

    parser.add_argument('-t', '--task',
                       help='Task to do. Either "enroll" or "recognize"',
                       required=True)
    parser.add_argument( '-n', '--name',
                        help='Specify the name of the person you want to enroll',
                        required=True)
    parser.add_argument('-f', '--file',
                        help='Specify the audio file you want to enroll',
                        type=lambda fn:file_choices(("csv","wav","flac"),fn),
                       required=True)
    ret = parser.parse_args()
    return ret

#Helper functions
def file_choices(choices,filename):
    ext = os.path.splitext(filename)[1][1:]
    if ext not in choices:
        parser.error("file doesn't end with one of {}".format(choices))
    return filename

def get_extension(filename):
    return os.path.splitext(filename)[1][1:]

if __name__ == '__main__':
    try:
        args = args()
    except Exception as e:
        print('An Exception occured, make sure the file format is .wav or .flac')
        exit()
    task = args.task
    file = args.file
    try:
        name = args.name
    except:
        if task =="enroll" and get_extension(file)!= 'csv':
            print("Missing Arguement, -n name is required for the user name")
            exit()
    try:
        if Path(p.AUDIO_FILE+"/"+file).is_file():
            file = p.AUDIO_FILE+"/"+file
    except:
        print("Audio not found")
        exit()

    if task == 'enroll':
        enroll(name, file)
    if task == 'recognize':
        name = recognize(name, file)
        speech = speech_recognize(file)
        print("\nName: " + str(name) + " | Speech: " + str(speech))
        exit()


#enroll("JLBixby", os.path.abspath(r"C:\Users\chinb\Documents\GitHub\ict2205-crypto_pt2\Voice-Speech-Authentication\audio\JLBixby.wav"))
#recognize("KK_test1", os.path.abspath(r"C:\Users\chinb\Documents\GitHub\ict2205-crypto_pt2\Voice-Speech-Authentication\audio\KK_test1.wav"))
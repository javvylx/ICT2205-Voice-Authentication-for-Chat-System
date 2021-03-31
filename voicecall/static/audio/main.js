
var context = new AudioContext({
      latencyHint: 'interactive',
      latencyHint: 0,
      sampleRate: 68100,
    });

var sb = new SoundBuffer(context, 160000, 2);
var socketio = io.connect(location.origin);
var mediaRecorder;
var audio_queue = new Queue2();
var constraints = { audio:{
        // Constraints seem to have little effect in Firefox.
        echoCancellation: true,
        autoGainControl: true,
        noiseSuppression: true
    } };

function hexStringToByte(str) {
    if (!str) {
      return new Uint8Array();
    }

    var a = [];
    for (var i = 0, len = str.length; i < len; i+=2) {
      a.push(parseInt(str.substr(i,2),16));
    }

    return new Uint8Array(a);
  }


function aesAudioEncryption(byteArrayInput, key){
    var x  = CryptoJS.lib.WordArray.create(byteArrayInput);
    // Word Array to hex
    var hex = CryptoJS.enc.Hex.stringify(x);
    // Parse in key and iv as hex
    var key  = CryptoJS.enc.Hex.parse(key);
    var iv   = CryptoJS.enc.Hex.parse("00000000000000000000000000000000");
    // AES encrypt
    var encrypted = CryptoJS.AES.encrypt(hex, key, {iv: iv});

    return encrypted.toString();
}

function aesAudioDecryption(encryptedString, key){
    var key  = CryptoJS.enc.Hex.parse(key);
    var iv   = CryptoJS.enc.Hex.parse("00000000000000000000000000000000");
    var decrypted = CryptoJS.AES.decrypt(encryptedString, key, {iv: iv});
    decrypted = decrypted.toString(CryptoJS.enc.Utf8)
    return hexStringToByte(decrypted).buffer;
}

function appendBuffer( buffer1, buffer2 ) {
    var tmp = new Uint8Array( buffer1.byteLength + buffer2.byteLength );
    tmp.set( new Uint8Array( buffer1 ), 0 );
    tmp.set( new Uint8Array( buffer2 ), buffer1.byteLength );
    console.log(tmp.buffer);
    return tmp.buffer;
}

function gotStream(mediaStream) {
    mediaRecorder = new MediaRecorder(mediaStream);
    var temp = new Uint8Array(0);

    mediaRecorder.onstart = function(e) {
        this.chunks = [];
    };

    mediaRecorder.ondataavailable = async function(e) {
        this.chunks.push(e.data);

        // Test concat chunks before send to server
        var blob = new Blob(this.chunks, { 'type' : 'audio/ogg; codecs=opus' });
        chunks = [];
        const arrayBuffer = await new Response(blob).arrayBuffer();
        socketio.emit('send', aesAudioEncryption(arrayBuffer,"253D3FB468A0E24677C28A624BE0F939"));
    };
    // Start recording
    mediaRecorder.start(10);

}

function play( samples ) {
    //end of stream has been reached
    if (samples.length === 0) { return; }
    sb.addChunk(samples)
}

function atest (queue){
    if (!queue.is_empty()) {
        var audio = audio_queue.get_nowait()

        if (audio.length !== 0){
            var buffer = new Uint8Array( audio.length );
            buffer.set(audio , 0 );
            context.decodeAudioData(buffer.buffer, play);
        }
    }

}

// When the client receives a voice message it will play the sound
socketio.on('voice', function(byteArray) {
    var a = new Uint8Array(aesAudioDecryption(byteArray, "253D3FB468A0E24677C28A624BE0F939"));

    if (audio_queue.is_full()) {
        // Drop the oldest packet.
        audio_queue.get_nowait()
    }
    audio_queue.put_nowait(a);

    atest(audio_queue);
});

// Setup microphone-mute button.
const btnToggleMute = document.getElementById('record');
var muted = false;

function setMuted(is_muted) {
    muted = is_muted
    if (muted) {
        mediaRecorder.stream.getAudioTracks()[0].enabled = false;
    } else {
        mediaRecorder.stream.getAudioTracks()[0].enabled = true;
    }
}



btnToggleMute.addEventListener('click', async () => {
    setMuted(!muted)
})


// Check that browser allows
function initAudio() {
    if (!navigator.getUserMedia)
        navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if (!navigator.cancelAnimationFrame)
        navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
    if (!navigator.requestAnimationFrame)
        navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

    navigator.getUserMedia(constraints, gotStream, function(e) {
        alert('Error getting audio');
        console.log(e);
    });
}

window.addEventListener('load', initAudio );
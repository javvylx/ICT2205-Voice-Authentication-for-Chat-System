

var context = new AudioContext({
  latencyHint: 'interactive',
  latencyHint: 0,
  sampleRate: 16000,
  frame_size = 512,
  sample_size = 2
});

var sb = new SoundBuffer(context, context.sampleRate, 2);
var socketio = io.connect(location.origin);
var constraints = { audio: true };

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
    console.log("Encrypted");
    //console.log(encrypted.toString())
    return encrypted.toString();
}

function aesAudioDecryption(encryptedString, key){
    var key  = CryptoJS.enc.Hex.parse(key);
    var iv   = CryptoJS.enc.Hex.parse("00000000000000000000000000000000");
    var decrypted = CryptoJS.AES.decrypt(encryptedString, key, {iv: iv});
    decrypted = decrypted.toString(CryptoJS.enc.Utf8)
    console.log("decrpyted");
    console.log(hexStringToByte(decrypted).buffer);
    return hexStringToByte(decrypted).buffer;
}

function concatTypedArray(a, b) {
    var c = new (a.constructor)(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    return c;
}

async function gotStream(mediaStream) {
    const AudioContext = (window.AudioContext || window.webkitAudioContext)
    var audioContext = null
    audioContext = new AudioContext();
    
    console.log("Test");
    var mediaRecorder = new MediaRecorder(mediaStream);
    const mic_sample_rate = audioContext.sampleRate
    var track = mediaStream.getAudioTracks()[0]
    var track_settings = track.getSettings()
    var audioInput = audioContext.createMediaStreamSource(mediaStream);
    var recorder = audioContext.createScriptProcessor(4096, 1, 1);
    console.log("Test2");
    var bufferOriginal = new Float32Array(0);
    var bufferResampled = new Float32Array(0);
    console.log("Test33");
    mediaRecorder.onstart = function(e) {
        this.chunks = [];
    };
    console.log("Test3333");
    mediaRecorder.ondataavailable = async function (e) {
        console.log("Test3");
        var sourceAudioBuffer = e.inputBuffer;
        var samples = sourceAudioBuffer.getChannelData(0)
        bufferOriginal = concatTypedArray(bufferOriginal, samples);
        var resample_frame_size = mic_sample_rate / 100;
        console.log("Test4");
        while (bufferOriginal.length >= resample_frame_size*2) {
            var samples = bufferOriginal.slice(0, resample_frame_size*2);
            var newSamples = waveResampler.resample(samples, mic_sample_rate, sample_rate);
            newSamples = newSamples.slice(newSamples.length/4, newSamples.length/2 + newSamples.length/4);
            bufferResampled = concatTypedArray(bufferResampled, newSamples)
            bufferOriginal = bufferOriginal.slice(resample_frame_size)
            console.log("Test5");
        }
        while (bufferResampled.length >= 512) {
            frame = bufferResampled.slice(0, 512)
            var intAudio = new Int16Array(frame.length)
            for (var j = 0; j < frame.length; j++) {
                intAudio[j] = Math.round(frame[j] * (1<<15))
            }
            console.log("Test6");
            var data = new Uint8Array(intAudio.buffer)
            socketio.emit('send', aesAudioEncryption(data,"253D3FB468A0E24677C28A624BE0F939"));
            bufferResampled = bufferResampled.slice(frame_size)
            console.log("Test7");

        }
    }

//     mediaRecorder.onstart = function(e) {
//         this.chunks = [];
//     };

//     mediaRecorder.ondataavailable = async function(e) {
//         this.chunks.push(e.data);
//         var blob = new Blob(this.chunks, { 'type' : 'audio/ogg; codecs=opus' });
//         arrayBuffer = await new Response(blob).arrayBuffer();
//         console.log(arrayBuffer);
//         socketio.emit('send', aesAudioEncryption(arrayBuffer,"253D3FB468A0E24677C28A624BE0F939"));
//         arrayBuffer = null;
// //        socketio.emit('send', blob);
//     };
//     // Start recording
//     mediaRecorder.start(10);

}

function play( samples ) {
  //end of stream has been reached
    if (samples.length === 0) { return; }
    sb.addChunk(samples)
}


// When the client receives a voice message it will play the sound
socketio.on('voice', function(byteArray) {
//    var blob = new Blob([arrayBuffer], { 'type' : 'audio/ogg; codecs=opus' });
//    console.log(arrayBuffer);
//    var audio = document.createElement('audio');
//    audio.src = window.URL.createObjectURL(blob);
//    audio.play();


    var a = new Uint8Array(aesAudioDecryption(byteArray, "253D3FB468A0E24677C28A624BE0F939"));
//    var a = new Uint8Array(byteArray);

    if (a.length !== 0){
        var buffer = new Uint8Array( a.length );
        buffer.set(a , 0 );
        context.decodeAudioData(buffer.buffer, play);
        buffer = null;
    }
    a = null;
});

function initAudio() {
    if (!navigator.getUserMedia)
        navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if (!navigator.cancelAnimationFrame)
        navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
    if (!navigator.requestAnimationFrame)
        navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

    navigator.getUserMedia({audio: {
        // Constraints seem to have little effect in Firefox.
        sampleRate: 16000,
        sampleSize: 16,
        echoCancellation: true,
        autoGainControl: true,
        noiseSuppression: true
    }}, gotStream, function(e) {
        alert('Error getting audio');
        console.log(e);
    });
}

window.addEventListener('load', initAudio );
//window.AudioContext = window.AudioContext || window.webkitAudioContext;
//
//var audioContext = new AudioContext();
//var audioInput = null,
//    realAudioInput = null,
//    inputPoint = null,
//    recording = true;
//var rafID = null;
//var analyserContext = null;
//var canvasWidth, canvasHeight;
//var socketio = io.connect(location.origin);
//
//
//function playWave(byteArray) {
//    if (byteArray.bytelength !== 0){
//        var audioCtx = new AudioContext();
//        var myAudioBuffer = audioCtx.createBuffer(1, byteArray.bytelength, audioCtx.sampleRate);
//        var nowBuffering = myAudioBuffer.getChannelData(0);
//        for (var i = 0; i < byteArray.length; i++) {
//            nowBuffering[i] = byteArray[i];
//        }
//
//        var source = audioCtx.createBufferSource();
//        myAudioBuffer.getChannelData(0).set(byteArray);
//        source.buffer = myAudioBuffer;
//        source.connect(audioCtx.destination);
//        source.start();
//    }
//
//}
//
//
//socketio.on('receive-audio', function(data) {
//
//    var uint8View = new Uint8Array(data);
//    playWave(hexStringToByte(data));
//});
//
//function hexStringToByte(str) {
//    if (!str) {
//      return new Uint8Array();
//    }
//
//    var a = [];
//    for (var i = 0, len = str.length; i < len; i+=2) {
//      a.push(parseInt(str.substr(i,2),16));
//    }
//
//    return new Uint8Array(a);
//  }
//
//function convertToMono( input ) {
//    var splitter = audioContext.createChannelSplitter(2);
//    var merger = audioContext.createChannelMerger(2);
//
//    input.connect( splitter );
//    splitter.connect( merger, 0, 0 );
//    splitter.connect( merger, 0, 1 );
//    return merger;
//}
//
//function cancelAnalyserUpdates() {
//    window.cancelAnimationFrame( rafID );
//    rafID = null;
//}
//
//// Update wavelength display
//function updateAnalysers(time) {
//    if (!analyserContext) {
//        var canvas = document.getElementById('analyser');
//        canvasWidth = canvas.width;
//        canvasHeight = canvas.height;
//        analyserContext = canvas.getContext('2d');
//    }
//
//    // analyzer draw code here
//    {
//        var SPACING = 3;
//        var BAR_WIDTH = 1;
//        var numBars = Math.round(canvasWidth / SPACING);
//        var freqByteData = new Uint8Array(analyserNode.frequencyBinCount);
//
//        analyserNode.getByteFrequencyData(freqByteData);
//
//        analyserContext.clearRect(0, 0, canvasWidth, canvasHeight);
//        analyserContext.fillStyle = '#F6D565';
//        analyserContext.lineCap = 'round';
//        var multiplier = analyserNode.frequencyBinCount / numBars;
//
//        // Draw rectangle for each frequency bin.
//        for (var i = 0; i < numBars; ++i) {
//            var magnitude = 0;
//            var offset = Math.floor( i * multiplier );
//            // gotta sum/average the block, or we miss narrow-bandwidth spikes
//            for (var j = 0; j< multiplier; j++)
//                magnitude += freqByteData[offset + j];
//            magnitude = magnitude / multiplier;
//            var magnitude2 = freqByteData[i * multiplier];
//            analyserContext.fillStyle = "hsl( " + Math.round((i*360)/numBars) + ", 100%, 50%)";
//            analyserContext.fillRect(i * SPACING, canvasHeight, BAR_WIDTH, -magnitude);
//        }
//    }
//
//    rafID = window.requestAnimationFrame( updateAnalysers );
//}
//
//function toggleMono() {
//    if (audioInput != realAudioInput) {
//        audioInput.disconnect();
//        realAudioInput.disconnect();
//        audioInput = realAudioInput;
//    } else {
//        realAudioInput.disconnect();
//        audioInput = convertToMono( realAudioInput );
//    }
//
//    audioInput.connect(inputPoint);
//}
//
//function gotStream(stream) {
//    inputPoint = audioContext.createGain();
//
//    // Create an AudioNode from the stream.
//    realAudioInput = audioContext.createMediaStreamSource(stream);
//    audioInput = realAudioInput;
//
//    audioInput = convertToMono( audioInput );
//    audioInput.connect(inputPoint);
//
//    analyserNode = audioContext.createAnalyser();
//    analyserNode.fftSize = 2048;
//    inputPoint.connect( analyserNode );
//
//    scriptNode = (audioContext.createScriptProcessor || audioContext.createJavaScriptNode).call(audioContext, 1024, 1, 1);
//    scriptNode.onaudioprocess = function (audioEvent) {
//        if (recording) {
//            input = audioEvent.inputBuffer.getChannelData(0);
//
//            // convert float audio data to 16-bit PCM
//            var buffer = new ArrayBuffer(input.length * 2)
//            var output = new DataView(buffer);
//            for (var i = 0, offset = 0; i < input.length; i++, offset += 2) {
//                var s = Math.max(-1, Math.min(1, input[i]));
//                output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
//            }
//
//            socketio.emit('audio-in', buffer);
//        }
//    }
//
//    inputPoint.connect(scriptNode);
//    scriptNode.connect(audioContext.destination);
//
//    zeroGain = audioContext.createGain();
//    zeroGain.gain.value = 0.0;
//    inputPoint.connect( zeroGain );
//    zeroGain.connect( audioContext.destination );
//    updateAnalysers();
//}
//

var context = new AudioContext({
  latencyHint: 'interactive',
  latencyHint: 0,
  sampleRate: 68100,
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
    var encrypted = CryptoJS.AES.encrypt(hex, key, {iv: iv, padding: CryptoJS.pad.NoPadding});
    console.log("Encrypted");

    return encrypted.toString(CryptoJS.enc.Hex);
}

function aesAudioDecryption(encryptedString, key){
    var key  = CryptoJS.enc.Hex.parse(key);
    var iv   = CryptoJS.enc.Hex.parse("00000000000000000000000000000000");
    var decrypted = CryptoJS.AES.decrypt(encryptedString, key, {iv: iv, padding: CryptoJS.pad.NoPadding});
    decrypted = decrypted.toString(CryptoJS.enc.Utf8)
    console.log("decrpyted");
    console.log(hexStringToByte(decrypted).buffer);
    return hexStringToByte(decrypted).buffer;
}

async function gotStream(mediaStream) {
    var mediaRecorder = new MediaRecorder(mediaStream);

    mediaRecorder.onstart = function(e) {
        this.chunks = [];
    };

    mediaRecorder.ondataavailable = async function(e) {
        this.chunks.push(e.data);
        var blob = new Blob(this.chunks, { 'type' : 'audio/ogg; codecs=opus' });
        const arrayBuffer = await new Response(blob).arrayBuffer();
        console.log(arrayBuffer);
        socketio.emit('send', aesAudioEncryption(arrayBuffer,"253D3FB468A0E24677C28A624BE0F939"));
//        socketio.emit('send', blob);
    };
    // Start recording
    mediaRecorder.start(10);

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
    }
});

function initAudio() {
    if (!navigator.getUserMedia)
        navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if (!navigator.cancelAnimationFrame)
        navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
    if (!navigator.requestAnimationFrame)
        navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

    navigator.getUserMedia({audio: true}, gotStream, function(e) {
        alert('Error getting audio');
        console.log(e);
    });
}

window.addEventListener('load', initAudio );
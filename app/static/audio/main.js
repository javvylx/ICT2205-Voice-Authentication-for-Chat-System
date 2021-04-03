window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = new AudioContext();
var audioInput = null,
    realAudioInput = null,
    inputPoint = null,
    recording = false;
var rafID = null;
var analyserContext = null;
var canvasWidth, canvasHeight;
var socketio = io.connect(location.origin);

function displaySpeech(string,list,list2){
                console.log(string);
                var result = "";
                str1 = "Result is - ";
                result = str1.concat(string);
                console.log(result);
                removeChild(list);
                removeChild(list2);
                $("#description").append("Record again if the speech result is a moot point ");
                $("#result").append(result);
                string = "";

            }
function displayRecording(string){
                console.log(string);
                $("#description").append(string);
            }
function removeChild(list){
            while (list.hasChildNodes()) {
            list.removeChild(list.firstChild);
        }}

// To toggle recording, send relevant emit back to server for start/stop
function toggleRecording( e ) {
    console.log(e);
    console.log("toggled");
    var description = document.getElementById("description");
    var result = document.getElementById("result");

    if (e.classList.contains('recording')) {
        console.log("stop");
        // stop recording
        e.classList.remove('recording');
        recording = false;
        socketio.emit('end-recording');
        removeChild(description);
        socketio.emit('confirmation');

        $("#description").append("Processing");
        socketio.on('confirmspeech', function(data) {
                    displaySpeech(data,description,result);
        });

    } else {
        removeChild(description);
        removeChild(result);
        $("#description").append("Recording");
        // start recording
        e.classList.add('recording');
        recording = true;
        socketio.emit('start-recording', {numChannels: 1, bps: 16, fps: parseInt(audioContext.sampleRate)});
    }
}

function convertToMono( input ) {
    var splitter = audioContext.createChannelSplitter(2);
    var merger = audioContext.createChannelMerger(2);

    input.connect( splitter );
    splitter.connect( merger, 0, 0 );
    splitter.connect( merger, 0, 1 );
    return merger;
}


function toggleMono() {
    if (audioInput != realAudioInput) {
        audioInput.disconnect();
        realAudioInput.disconnect();
        audioInput = realAudioInput;
    } else {
        realAudioInput.disconnect();
        audioInput = convertToMono( realAudioInput );
    }

    audioInput.connect(inputPoint);
}

function gotStream(stream) {
    inputPoint = audioContext.createGain();

    // Create an AudioNode from the stream.
    realAudioInput = audioContext.createMediaStreamSource(stream);
    audioInput = realAudioInput;

    audioInput = convertToMono( audioInput );
    audioInput.connect(inputPoint);

    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048;
    inputPoint.connect( analyserNode );

    scriptNode = (audioContext.createScriptProcessor || audioContext.createJavaScriptNode).call(audioContext, 1024, 1, 1);
    scriptNode.onaudioprocess = function (audioEvent) {
        if (recording) {
            input = audioEvent.inputBuffer.getChannelData(0);

            // convert float audio data to 16-bit PCM
            var buffer = new ArrayBuffer(input.length * 2)
            var output = new DataView(buffer);
            for (var i = 0, offset = 0; i < input.length; i++, offset += 2) {
                var s = Math.max(-1, Math.min(1, input[i]));
                output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            }
            console.log("write");
            socketio.emit('write-audio', buffer);
        }
    }
    inputPoint.connect(scriptNode);
    scriptNode.connect(audioContext.destination);

    zeroGain = audioContext.createGain();
    zeroGain.gain.value = 0.0;
    inputPoint.connect( zeroGain );
    zeroGain.connect( audioContext.destination );
}

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
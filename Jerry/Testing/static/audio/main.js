var socketio = io.connect(location.origin);
let constraintObj = {
    audio: true,
    video: false
};

var context = new AudioContext({
    latencyHint: 'interactive',
    latencyHint: 0,
    sampleRate: 68100,
});

var sb = new SoundBuffer(context, context.sampleRate, 2);

var audio_queue = new Queue(maxsize = 4)

function concatTypedArray(a, b) {
    var c = new (a.constructor)(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    return c;
}

function play(samples) {
    //end of stream has been reached
    if (samples.length === 0) { return; }
    sb.addChunk(samples)
}


function hexStringToByte(str) {
    if (!str) {
        return new Uint8Array();
    }

    var a = [];
    for (var i = 0, len = str.length; i < len; i += 2) {
        a.push(parseInt(str.substr(i, 2), 16));
    }

    return new Uint8Array(a);
}

function aesAudioEncryption(byteArrayInput, key) {
    var x = CryptoJS.lib.WordArray.create(byteArrayInput);
    // Word Array to hex
    var hex = CryptoJS.enc.Hex.stringify(x);
    // Parse in key and iv as hex
    var key = CryptoJS.enc.Hex.parse(key);
    var iv = CryptoJS.enc.Hex.parse("00000000000000000000000000000000");
    // AES encrypt
    var encrypted = CryptoJS.AES.encrypt(hex, key, { iv: iv });
    console.log("Encrypted");
    console.log(encrypted.toString())
    return encrypted.toString();
}

function aesAudioDecryption(encryptedString, key) {
    var key = CryptoJS.enc.Hex.parse(key);
    var iv = CryptoJS.enc.Hex.parse("00000000000000000000000000000000");
    var decrypted = CryptoJS.AES.decrypt(encryptedString, key, { iv: iv });
    decrypted = decrypted.toString(CryptoJS.enc.Utf8)
    console.log("decrpyted");
    console.log(hexStringToByte(decrypted).buffer);
    return hexStringToByte(decrypted).buffer;
}

async function run_speaker(audio_queue) {
    console.log("Start speaker task.")
    //var audioContext = new (window.AudioContext || window.webkitAudioContext)({sampleRate:sample_rate});

    var speaker_sample_rate = getAudioContext().sampleRate
    console.log("Speaker sample rate: " + speaker_sample_rate)

    // Create empty buffers.
    var bufferOriginal = new Float32Array(0)
    var bufferResampled = new Float32Array(0)

    var bufferSize = 512;
    var scriptProcessor = getAudioContext().createScriptProcessor(bufferSize, 1, 1);
    var floatSamples = new Float32Array(bufferSize);
    scriptProcessor.onaudioprocess = function (e) {
        var output = e.outputBuffer.getChannelData(0);
        for (var i = 0; i < bufferSize; i++) {
            output[i] = 0;
        }
        if (!audio_queue.is_empty()) {
            var audio = audio_queue.get_nowait()

            for (var i = 0; i < bufferSize; i++) {
                floatSamples[i] = audio[i] * 1.0 / (1 << 15); // Convert to float.
            }

            // Append frame to non-resampled buffer.
            bufferOriginal = concatTypedArray(bufferOriginal, floatSamples)

            // Microphone sample rate is assumed to be a multiple of 100.
            // Also the target sample rate is assumed to be a multiple of 100.
            // Resampling is performed on a sliding window.
            var resample_frame_size = speaker_sample_rate / 100
            // Resample frame by frame.
            while (bufferOriginal.length >= resample_frame_size * 2) {
                // https://github.com/rochars/wave-resampler
                var samples = bufferOriginal.slice(0, resample_frame_size * 2)
                // Resample!
                var newSamples = waveResampler.resample(samples, 16000, speaker_sample_rate);
                newSamples = newSamples.slice(newSamples.length / 4, newSamples.length / 2 + newSamples.length / 4)

                // Append the resampled frame to the buffer.
                bufferResampled = concatTypedArray(bufferResampled, newSamples)

                // Remove the processed frame from the buffer.
                bufferOriginal = bufferOriginal.slice(resample_frame_size)
            }
        }


        if (bufferResampled.length >= bufferSize) {
            frame = bufferResampled.slice(0, bufferSize)

            for (var i = 0; i < bufferSize; i++) {
                output[i] = frame[i];
            }

            // Remove processed data.
            bufferResampled = bufferResampled.slice(512)
        }
    }


    /*
    // Version with correct speaker sample rate. Here no resampling is necessary, but echo cancellation does not work.
    var audioContext = new (window.AudioContext || window.webkitAudioContext)({sampleRate:sample_rate});
    debug("Speaker sample rate: " + audioContext.sampleRate)
    var bufferSize = frame_size;
    var scriptProcessor = audioContext.createScriptProcessor(bufferSize, 1, 1);
    scriptProcessor.onaudioprocess = function(e) {
        var output = e.outputBuffer.getChannelData(0);
        for (var i = 0; i < bufferSize; i++) {
            output[i] = 0;
        }
        if (!audio_queue.is_empty()) {
            var audio = audio_queue.get_nowait()
            for (var i = 0; i < bufferSize; i++) {
                output[i] = audio[i] * 1.0 / (1<<15); // Convert to float.
            }
        }
    }
    */

    scriptProcessor.connect(getAudioContext().destination);
}

async function main() {
    //handle older browsers that might implement getUserMedia in some way
    console.log("test0");
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            devices.forEach(device => {
                console.log(device.kind.toUpperCase(), device.label);
            })
        })
        .catch(err => {
            console.log(err.name, err.message);
        })

    navigator.mediaDevices.getUserMedia(constraintObj)
        .then(function (mediaStreamObj) {

            let start = document.getElementById('start');
            let stop = document.getElementById('stop');
            let mediaRecorder = new MediaRecorder(mediaStreamObj);
            let chunks = [];

            console.log("test1");

            start.addEventListener('click', (ev) => {
                mediaRecorder.start();
                console.log(mediaRecorder.state);
            })
            stop.addEventListener('click', (ev) => {
                mediaRecorder.stop();
                console.log(mediaRecorder.state);
            });
            mediaRecorder.ondataavailable = async function (ev) {
                chunks.push(ev.data);
                var blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' });
                const arrayBuffer = await new Response(blob).arrayBuffer();
                console.log(arrayBuffer);
                socketio.emit('send', aesAudioEncryption(arrayBuffer, "253D3FB468A0E24677C28A624BE0F939"));
                // blob.arrayBuffer().then((value) => {
                //     console.log(value);
                //     socketio.emit('send', aesAudioEncryption(value, "253D3FB468A0E24677C28A624BE0F939"));
                // });
                chunks = [];
            }
            console.log("test2");
            mediaRecorder.onstop = (ev) => {
                chunks = [];
            }
        })
        .catch(function (err) {
            console.log(err.name, err.message);
        });

    const AudioContext = (window.AudioContext || window.webkitAudioContext)
    var audioContext = null

    function getAudioContext() {
        if (audioContext == null) {
            audioContext = new AudioContext()
        }
        return audioContext
    }

    console.log("test before rs")

    let source;
    socketio.on('voice', function (byteArray) {
        var audioData = aesAudioDecryption(byteArray, "253D3FB468A0E24677C28A624BE0F939");

        source = getAudioContext().createBufferSource();
        let scriptNode = getAudioContext().createScriptProcessor(4096, 1, 1);
        console.log(scriptNode.bufferSize);
        function getData() {
            getAudioContext().decodeAudioData(audioData, function (buffer) {
                myBuffer = buffer;
                source.buffer = myBuffer;
            }, function (e) { "Error with decoding audio data" + e.err });
        }
        scriptNode.onaudioprocess = function (audioProcessingEvent) {
            // The input buffer is the song we loaded earlier
            let inputBuffer = audioProcessingEvent.inputBuffer;

            // The output buffer contains the samples that will be modified and played
            let outputBuffer = audioProcessingEvent.outputBuffer;

            // Loop through the output channels (in this case there is only one)
            for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
                let inputData = inputBuffer.getChannelData(channel);
                let outputData = outputBuffer.getChannelData(channel);

                // Loop through the 4096 samples
                for (let sample = 0; sample < inputBuffer.length; sample++) {
                    // make output equal to the same as the input
                    outputData[sample] = inputData[sample];

                    // add noise to each output sample
                    outputData[sample] += ((Math.random() * 2) - 1) * 0.2;
                }
            }
        }
        getData();

        source.connect(scriptNode);
        scriptNode.connect(getAudioContext().destination);
        source.start();

        // When the buffer source stops playing, disconnect everything
        source.onended = function () {
            source.disconnect(scriptNode);
            scriptNode.disconnect(getAudioContext().destination);
        }

    });

};

main();
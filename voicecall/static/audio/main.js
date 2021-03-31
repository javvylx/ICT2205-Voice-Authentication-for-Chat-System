var socketio = io.connect(location.origin);
let constraintObj = {
    audio: true,
    video: false
};

function concatTypedArray(a, b) {
    var c = new (a.constructor)(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    return c;
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

let nextTime = 0;

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

            let start = document.getElementById('record');
            let mediaRecorder = new MediaRecorder(mediaStreamObj);
            let chunks = [];


            start.addEventListener('click', (ev) => {
                if (start.innerHTML == "Record"){
                    mediaRecorder.start();
                    start.innerHTML = "Stop Record";
                }
                else {
                    console.log(start.innerHTML)
                    mediaRecorder.stop();

                    start.innerHTML = "Record";
                }

                console.log(mediaRecorder.state);
            })

            var toggleVisibility = function(element) {
                if(element.style.display=='block'){
                    element.style.display='none';
                } else {
                    element.style.display='block';
                }
            };

            mediaRecorder.ondataavailable = async function (ev) {
                chunks.push(ev.data);
                var blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' });
                const arrayBuffer = await new Response(blob).arrayBuffer();
                console.log(arrayBuffer);
                socketio.emit('send', aesAudioEncryption(arrayBuffer, "253D3FB468A0E24677C28A624BE0F939"));
                chunks = [];
            }
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

    let source;
    socketio.on('voice', function (byteArray) {
        var audioData = aesAudioDecryption(byteArray, "253D3FB468A0E24677C28A624BE0F939");
        const currentTime = getAudioContext().currentTime;
        source = getAudioContext().createBufferSource();
        let scriptNode = getAudioContext().createScriptProcessor(4096, 1, 1);

        function getData() {
            getAudioContext().decodeAudioData(audioData, function (buffer) {
                myBuffer = buffer;
                source.buffer = myBuffer;
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

                source.connect(getAudioContext().destination);

                if (nextTime == 0) {
                    nextTime = currentTime + 0.2; /// add 700ms latency to work well across systems - tune this if you like
                }

                let duration = source.buffer.duration;
                let offset = 0;

                if (currentTime > nextTime) {
                    offset = currentTime - nextTime;
                    nextTime = currentTime;
                    duration = duration - offset;
                }

                source.start(nextTime, offset);
                source.stop(nextTime + duration);

                nextTime = 0;
            }, function (e) { "Error with decoding audio data" + e.err });
        }

        getData();

    });

};

main();
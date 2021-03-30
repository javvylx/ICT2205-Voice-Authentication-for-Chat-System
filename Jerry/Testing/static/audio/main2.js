/*
 * Copyright (c) 2020 Thomas Kramer.
 *
 * This file is part of picoTalk 
 * (see https://codeberg.org/tok/picotalk).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */



const version = [0, 0, 20]

const sample_rate = 16000 // Audio sample rate.
const frame_size = 512 // Number of samples in an audio frame.
const sample_size = 2 // Size of a sample in bytes.
const server_id = 1

// Concatenate two typed arrays such as UInt8Arrays.
function concatTypedArray(a, b) {
    var c = new (a.constructor)(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    return c;
}

// Convert a byte array into a hex-string.
function hex(byteArray) {
  return Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('')
}

// Convert a hex-string into a Uint8Array.
function parseHex(str) {
    var result = [];
    while (str.length >= 2) {
        result.push(parseInt(str.substring(0, 2), 16));
        str = str.substring(2, str.length);
    }

    return new Uint8Array(result);
}

// Convert a byte array to a string.
function bytes2str(str) {
    var text_dec = new TextDecoder()
    return text_dec.decode(str)
}

// Convert a string to a byte array.
function str2bytes(bytes) {
    var text_enc = new TextEncoder()
    return text_enc.encode(bytes)
}

// Convert a UInt8Array to an ArrayBuffer.
function uint8ArrayToBuffer(array) {
    return array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset)
}

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

var context = new AudioContext({
    latencyHint: 'interactive',
    latencyHint: 0,
    sampleRate: 16000,
  });

var sb = new SoundBuffer(context, context.sampleRate, 2);

function play( samples ) {
    //end of stream has been reached
      if (samples.length === 0) { return; }
      sb.addChunk(samples)
}

async function main() {
    console.log("Test");
    var socketio = io.connect(location.origin);
    
    const AudioContext = (window.AudioContext || window.webkitAudioContext)
    var audioContext = null
    
    function getAudioContext() {
        if (audioContext == null) {
            audioContext = new AudioContext()
            //const audioContext = new (window.AudioContext || window.webkitAudioContext)({sampleRate:sample_rate});
        }
        return audioContext
    }
    console.log("Test2");

    socketio.on('voice', async function (data) {
        var audio = aesAudioDecryption(data, "253D3FB468A0E24677C28A624BE0F939");

        if (audio.length !== 0){
            var buffer = new Uint8Array( audio.length );
            buffer.set(audio , 0 );
            context.decodeAudioData(buffer.buffer, play);
            buffer = null;
        }
        audio = null;
    });

    async function run_microphone() {
        console.log("Start microphone task.")

        var constraints = {
                audio: {
                    // Constraints seem to have little effect in Firefox.
                    sampleRate: sample_rate,
                    sampleSize: 16,
                    echoCancellation: true,
                    autoGainControl: true,
                    noiseSuppression: true
                }
            }
        console.log("Test222");
        try {
            console.log("Try to open media stream.")
            console.log("Test22");
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log("Media stream opened: " + stream)
            console.log("Test");

            //const audioContext = new (window.AudioContext || window.webkitAudioContext)() // ({sampleRate:sample_rate})
            const mic_sample_rate = getAudioContext().sampleRate
            console.log("Microphone stream sample rate: " + mic_sample_rate)
            var track = stream.getAudioTracks()[0]
            var track_settings = track.getSettings()
            console.log("Audio track settings: " + JSON.stringify(track_settings))

            var audioInput = getAudioContext().createMediaStreamSource(stream);

            var recorder = getAudioContext().createScriptProcessor(4096, 1, 1);

            // Create empty buffers.
            var bufferOriginal = new Float32Array(0)
            var bufferResampled = new Float32Array(0)

            // Frame counter for generating the encryption nonce.
            var encryption_counter = 1

            recorder.onaudioprocess = function (e) {

                ////// START RESAMPLE
                // Resample the audio signal and fill it into the buffer.
                var sourceAudioBuffer = e.inputBuffer;  // directly received by the audioprocess event from the microphone in the browser
                var samples = sourceAudioBuffer.getChannelData(0)
                // Append frame to non-resampled buffer.
                bufferOriginal = concatTypedArray(bufferOriginal, samples)

                // Microphone sample rate is assumed to be a multiple of 100.
                // Also the target sample rate is assumed to be a multiple of 100.
                // Resampling is performed on a sliding window.
                var resample_frame_size = mic_sample_rate / 100
                // Resample frame by frame.
                while (bufferOriginal.length >= resample_frame_size*2) {
                    // https://github.com/rochars/wave-resampler
                    var samples = bufferOriginal.slice(0, resample_frame_size*2)
                    // Resample!
                    var newSamples = waveResampler.resample(samples, mic_sample_rate, sample_rate);
                    newSamples = newSamples.slice(newSamples.length/4, newSamples.length/2 + newSamples.length/4)

                    // Append the resampled frame to the buffer.
                    bufferResampled = concatTypedArray(bufferResampled, newSamples)

                    // Remove the processed frame from the buffer.
                    bufferOriginal = bufferOriginal.slice(resample_frame_size)
                }

                // Dispatch audio frames, convert them to Int16 arrays and send them as packets to the server.
                while (bufferResampled.length >= frame_size) {
                    frame = bufferResampled.slice(0, frame_size)

                    // Convert float values to int16.
                    var intAudio = new Int16Array(frame.length)
                    for (var j = 0; j < frame.length; j++) {
                        intAudio[j] = Math.round(frame[j] * (1<<15))
                    }
                    // Append audio tag.
                    var data = new Uint8Array(intAudio.buffer)
                    console.log(data);
                    socketio.emit('send', aesAudioEncryption(data,"253D3FB468A0E24677C28A624BE0F939"));
                    bufferResampled = bufferResampled.slice(frame_size)
                }
            }

            audioInput.connect(recorder);
            recorder.connect(getAudioContext().destination);

        } catch(err) {
            /* handle the error */
            error("Error opening the media stream: " + err)
        }

    }
    run_microphone()

}

// Run main.
main()
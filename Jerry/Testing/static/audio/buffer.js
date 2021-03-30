class SoundBuffer {
    constructor(context, sampleRate, bufferSize, debug = true) {
        this.ctx = context;
        this.sampleRate = sampleRate;
        this.bufferSize = bufferSize;
        this.debug = debug;
        this.chunks = new Queue();
        this.isPlaying = false;
        this.startTime = 0;
        this.lastChunkOffset = 0;
    }
    createChunk(chunk) {
//        var audioBuffer = this.ctx.createBuffer(2, chunk.length, this.sampleRate);
//        audioBuffer.getChannelData(0).set(chunk);
        var source = this.ctx.createBufferSource();
        source.buffer = chunk;
        source.connect(this.ctx.destination);
        source.onended = (e) => {
            console.log("testa");
            this.chunks.dequeue();
            if (this.chunks.length() === 0) {
                this.isPlaying = false;
                this.startTime = 0;
                this.lastChunkOffset = 0;
            }
        };
        return source;
    }
    log(data) {
        if (this.debug) {
            console.log(new Date().toUTCString() + " : " + data);
        }
    }
    addChunk(data) {
        if (this.isPlaying && (this.chunks.length() > this.bufferSize)) {
            this.log("chunk discarded");
            this.chunks.dequeue()
            this.log(this.chunks.print());
            return;
        }
        else if (this.isPlaying && (this.chunks.length() <= this.bufferSize)) { // schedule & add right now
            this.log("chunk accepted");
            let chunk = this.createChunk(data);
            chunk.start(this.startTime, this.lastChunkOffset, chunk.buffer.duration);
            this.lastChunkOffset += chunk.buffer.duration;
//            this.chunks.enqueue(chunk);
        }
        else if ((this.chunks.length() < (this.bufferSize / 2)) && !this.isPlaying) { // add & don't schedule
            this.log("chunk queued");
            let chunk = this.createChunk(data);
            this.chunks.enqueue(chunk);
        }
        else { // add & schedule entire buffer
            this.log("queued chunks scheduled");
            this.isPlaying = true;
            let chunk = this.createChunk(data);
//            this.chunks.enqueue(chunk);
            this.startTime = this.ctx.currentTime;
            this.lastChunkOffset = 0;
            for (let i = 0; i < this.chunks.length(); i++) {
                let chunk = this.chunks.peek(i);
//                chunk.start(this.startTime, this.lastChunkOffset, chunk.buffer.duration);
                this.lastChunkOffset += chunk.buffer.duration;
            }
        }
    }
}
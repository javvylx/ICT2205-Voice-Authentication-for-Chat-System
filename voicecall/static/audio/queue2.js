// Asynchronous FIFO queue.
class Queue2 {
    constructor(maxsize=0) {
        this.maxsize=maxsize
        this.fifo = []
        this.get_resolve_callbacks = []
        this.put_resolve_callbacks = []
    }

    // Return the number of elements currently in the queue.
    qsize() {
        return this.fifo.length
    }

    // Check if the queue is full.
    is_full() {
        return !(this.qsize() == 0 || this.qsize() < this.maxsize)
    }

    // Check if the queue is empty.
    is_empty() {
        return this.qsize() == 0
    }

    // Put an element without waiting. This throws an exception if the queue is full.
    put_nowait(obj) {

        if (this.is_full()) {
            throw "Queue is full!"
        }

        // Store the object.
        this.fifo.push(obj)
        // Notify the callback, if there is any waiting.
        if (this.get_resolve_callbacks.length > 0) {
            var callback = this.get_resolve_callbacks.shift()
            var obj = this.fifo.shift()
            callback(obj)
        }
    }

    // Put an element or wait for space to be freed if the queue is full.
    async put(obj) {
        if (!this.is_full()) {
            // No need to wait for space to be freed.
            this.put_nowait(obj)
        } else {
            var p = new Promise((resolve, reject) => {
                this.put_resolve_callbacks.push(resolve);
            });
            await p
        }
    }

    // Get an element without waiting. This throws an exception if the queue is empty.
    get_nowait() {

        if (this.is_empty()) {
            throw "Queue is empty!"
        }

        var obj = this.fifo.shift() // Get oldest element.
        // Notify the callback, if there is any waiting.
        if (this.put_resolve_callbacks.length > 0) {
            var callback = this.get_resolve_callbacks.shift()
            callback()
        }
        return obj
    }

    // Get an element or wait for one to arrive if the queue is empty.
    async get() {
        if (this.qsize() > 0) {
            return this.get_nowait() // Remove and return the oldest element.
        }
        // FIFO is empty, have to wait until an object is put into the queue.
        var p = new Promise((resolve, reject) => {
            this.get_resolve_callbacks.push(resolve);
        });
        return p
    }
}
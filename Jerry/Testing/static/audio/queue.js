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

// Asynchronous FIFO queue.
class Queue {
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
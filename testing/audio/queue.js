class Queue{
    // Array is used to implement a Queue
    constructor() {
        this.items = [];
    }

    // enqueue function
    enqueue(element) {
        // adding element to the queue
        this.items.push(element);
    }

    // Remove Element (Remove First Element)
//    dequeue() {
//        // Check If Queue Is Not Empty
//        if (!this.isEmpty()) {
//            // Remove First Element
//            this.items.shift();
//        }
//        else {
//            console.log('Queue is empty');
//        }
//    };

    // dequeue function
    dequeue() {
        // removing element from the queue
        // returns underflow when called
        // on empty queue
        return this.items.shift();
    }

    // Is Empty
//    isEmpty() {
//        // Check If Array Is Empty
//        if (this.storage.length === 0) {
//            return true;
//        }
//        else {
//            return false;
//        }
//    };// Is Empty

    isEmpty(){
        return this.items.length == 0;
    }

    peek(i) {
//        if(!this.isEmpty()) {
//            return this.item[i]
//        } else {
//            console.log('No such element in Queue.');
//        }
        return !this.isEmpty() ? this.items[i] : undefined ;
    }

    // printQueue function
    print() {
        var str = "";
        for(var i = 0; i < this.items.length; i++)
            str += this.items[i] +" ";
        return str;
    }

    length(){
        return this.items.length;
    }
}
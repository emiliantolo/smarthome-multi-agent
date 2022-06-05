const Observable = require('../utils/Observable');



class Person extends Observable {
    constructor(house, name, room = 'bedroom') {
        super()
        this.house = house;             // reference to the house
        this.name = name;               // non-observable
        this.set('in_room', room)  // observable
        // log
        this.observe('in_room', v => console.log(this.name, 'moved to', v))    // observe
    }
    moveTo(to) {
        if (to === 'null' || this.in_room === 'null') { // outside house
            this.in_room = to
            return true
        } else if (this.house.rooms[this.in_room].doors_to.includes(to)) { // for object: to in this.house.rooms[this.in_room].doors_to
            this.in_room = to
            return true
        }
        else {
            console.log(this.name, '\t failed moving from', this.in_room, 'to', to)
            return false
        }
    }
    toJSON() { return this.name }
}



module.exports = Person
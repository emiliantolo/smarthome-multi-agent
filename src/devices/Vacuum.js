const Clock = require('../utils/Clock');
const Observable = require('../utils/Observable');

class Vacuum extends Observable {
    constructor(house, name) {
        super()
        this.house = house         // reference to the house
        this.name = name           // non-observable
        this.base = 'livingroom'
        this.set('status', 'off')   // observable
        this.set('in_room', 'livingroom')   // observable
        this.set('battery', 100)   // observable
        // log
        // log
        this.observe('status', v => console.log(this.name, 'vacuum', v))    // observe
        this.observe('in_room', v => console.log(this.name, 'moved to', v))    // observe
    }
    async clean() {
        this.status = 'on'
        let start = Clock.minutesFromStart()
        for (let i = 0; i < 10; i++) {
            await Clock.global.notifyAnyChange()
            if ((Clock.minutesFromStart() - start) >= 15)
                break
        }
        this.status = 'off'
        this.battery -= 40
        return true
    }
    async moveToRoom(room) {
        if (this.house.rooms[this.in_room].doors_to.includes(room)) {
            let start = Clock.minutesFromStart()
            for (let i = 0; i < 10; i++) {
                await Clock.global.notifyAnyChange()
                if ((Clock.minutesFromStart() - start) >= 5)
                    break
            }
            this.in_room = room
            return true
        }
        else {
            console.log(this.name, '\t failed moving from', this.in_room, 'to', room)
            return false
        }
    }
    async charge() {
        if (this.in_room !== this.base)
            return false
        let chargeTime = 0.3 * (100 - this.battery)
        if (chargeTime < 0)
            chargeTime = 0
        let start = Clock.minutesFromStart()
        this.house.utilities.electricity.consumption += 1
        for (let i = 0; i < 10; i++) {
            await Clock.global.notifyAnyChange()
            if ((Clock.minutesFromStart() - start) >= chargeTime)
                break
        }
        this.house.utilities.electricity.consumption -= 1
        this.battery = 100
        return true
    }
    toJSON() { return this.name }
}

module.exports = Vacuum
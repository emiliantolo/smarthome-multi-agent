const Observable = require('../utils/Observable');

class Irrigation extends Observable {
    constructor(house, name) {
        super()
        this.house = house         // reference to the house
        this.name = name           // non-observable
        this.set('status', 'off')   // observable
        // log
        this.observe('status', v => console.log(this.name, 'irrigation', v))    // observe
    }
    openValve() {
        this.status = 'on'
        return true
    }
    closeValve() {
        this.status = 'off'
        return true
    }
    toJSON() { return this.name }
}

module.exports = Irrigation
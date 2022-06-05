const Observable = require('../utils/Observable');

class Probe extends Observable {
    constructor(house, type, name, val) {
        super()
        this.house = house;             // reference to the house
        this.type = type;               // non-observable
        this.name = name;               // non-observable
        this.set('value', val)  // observable
        // log
        this.observe('value', v => console.log('Probe ' + this.type + ' ' + this.name + ' is ' + v))    // observe
    }
    increaseValue(amount) {
        this.value = this.value + amount;
    }
    setValue(value) {
        this.value = value;
    }
    toJSON() { return this.type + ' ' + this.name }
}

module.exports = Probe
const Observable = require('../utils/Observable');

class Curtains extends Observable {
    constructor(house, name) {
        super()
        this.house = house         // reference to the house
        this.name = name           // non-observable
        this.set('status', 'up')   // observable
        // log
        this.observe('status', v => console.log(this.name, 'curtains', v))    // observe
    }
    openCurtains() {
        if (this.status === 'up')
            return false
        this.status = 'up'
        let probe = this.house.probes.lights[this.name + '_light_probe']
        probe.increaseValue(this.house.environment.external_light.value)
        return true
    }
    closeCurtains() {
        if (this.status === 'down')
            return false
        this.status = 'down'
        let probe = this.house.probes.lights[this.name + '_light_probe']
        probe.increaseValue(-this.house.environment.external_light.value)
        return true
    }
    toJSON() { return this.name }
}

module.exports = Curtains
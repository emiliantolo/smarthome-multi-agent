const Clock = require('../utils/Clock');
const Observable = require('../utils/Observable');

class Heating extends Observable {
    constructor(house, name) {
        super()
        this.house = house         // reference to the house
        this.name = name           // non-
        this.set('status', 'off')   // observable
        // log
        this.observe('status', v => console.log(this.name + ' heating ' + v))    // observe
    }
    async startHeating() {
        this.status = 'on'
        this.house.utilities.gas.consumption += 1;

        let probe = this.house.probes.temperatures[this.name + '_temperature_probe']
        let start = Clock.minutesFromStart()
        for (let i = 0; i < 100; i++) {
            await Promise.race([Clock.global.notifyAnyChange(), this.notifyChange('status', 's')])
            let t = Clock.minutesFromStart()
            if ((t - start) >= 15) {
                probe.increaseValue(0.5)
                start = t
            }
            if (this.status === 'off')
                break
        }

        return true
    }
    stopHeating() {
        this.status = 'off'
        this.house.utilities.gas.consumption -= 1;
        return true
    }
    toJSON() { return this.name }
}

module.exports = Heating
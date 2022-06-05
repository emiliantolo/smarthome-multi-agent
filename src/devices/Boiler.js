const Clock = require('../utils/Clock');
const Observable = require('../utils/Observable');

class Boiler extends Observable {
    constructor(house, name) {
        super()
        this.house = house         // reference to the house
        this.name = name           // non-
        this.set('heating_gas', 'off')   // observable
        this.set('heating_solar', 'off')   // observable

        // log
        this.observe('heating_gas', v => console.log(this.name + ' heating_gas ' + v))    // observe
        this.observe('heating_solar', v => console.log(this.name + ' heating_solar ' + v))    // observe

    }
    async startGas() {
        this.heating_gas = 'on'
        this.house.utilities.gas.consumption += 1;

        let probe = this.house.devices.water_heating.water_probe
        let start = Clock.minutesFromStart()
        for (let i = 0; i < 10; i++) {
            await Promise.race([Clock.global.notifyAnyChange(), this.notifyChange('heating_gas')])
            let t = Clock.minutesFromStart()
            probe.increaseValue((t - start) * 2)
            start = t
            if (this.heating_gas === 'off')
                break
        }

        return true
    }
    stopGas() {
        this.heating_gas = 'off'
        this.house.utilities.gas.consumption -= 1;
        return true
    }
    async startSolar() {
        this.heating_solar = 'on'

        let probe = this.house.devices.water_heating.water_probe
        let start = Clock.minutesFromStart()
        for (let i = 0; i < 10; i++) {
            await Promise.race([Clock.global.notifyAnyChange(), this.notifyChange('heating_solar')])
            let t = Clock.minutesFromStart()
            probe.increaseValue((t - start) * 2)
            start = t
            if (this.heating_solar === 'off')
                break
        }

        return true
    }
    stopSolar() {
        this.heating_solar = 'off'
        return true
    }
    toJSON() { return this.name }
}

module.exports = Boiler
const Goal = require("../bdi/Goal")
const Intention = require("../bdi/Intention")

class SenseTemperaturesGoal extends Goal {
}

class SenseTemperaturesIntention extends Intention {
    static applicable(goal) {
        return goal instanceof SenseTemperaturesGoal
    }

    *exec({ water_heating } = parameters) {
        while (true) {
            let temperatureBoiler = water_heating.water_probe.notifyChange('value')
            let temperatureSolar = water_heating.solar_probe.notifyChange('value')
            yield Promise.race([temperatureBoiler, temperatureSolar])
            this.agent.beliefs.declare('boiler-temperature-low', water_heating.water_probe.value < 40)
            this.agent.beliefs.declare('boiler-temperature-high', water_heating.water_probe.value >= 60)
            this.agent.beliefs.declare('heat-solar', water_heating.solar_probe.value > water_heating.water_probe.value)
            this.agent.beliefs.declare('heat-gas', water_heating.solar_probe.value <= water_heating.water_probe.value)
        }
    }
}

class SenseBoilerHeatGoal extends Goal {
}

class SenseBoilerHeatIntention extends Intention {
    static applicable(goal) {
        return goal instanceof SenseBoilerHeatGoal
    }

    *exec({ water_heating } = parameters) {
        while (true) {
            let temperatureLow = yield this.agent.beliefs.notifyChange('boiler-temperature-low')
            if (temperatureLow) {
                this.agent.postSubGoal(new HeatWaterGoal({ water_heating }))
            }
        }
    }
}

class HeatWaterGoal extends Goal {
}

class HeatSolarIntention extends Intention {
    static applicable(goal) {
        return goal instanceof HeatWaterGoal
    }

    *exec({ water_heating } = parameters) {
        if (this.agent.beliefs.check('not heat-solar'))
            throw new Error('Failed heating solar')
        water_heating.boiler.startSolar()
        //heat solar until max
        yield this.agent.beliefs.notifyChange('heat-solar')
        water_heating.boiler.stopSolar()
        if (this.agent.beliefs.check('not boiler-temperature-high'))
            throw new Error('Failed heating solar')
    }
}

class HeatGasIntention extends Intention {
    static applicable(goal) {
        return goal instanceof HeatWaterGoal
    }

    *exec({ water_heating } = parameters) {
        water_heating.boiler.startGas()
        yield this.agent.beliefs.notifyChange('boiler-temperature-high')
        water_heating.boiler.stopGas()
    }
}

module.exports = { SenseTemperaturesGoal, SenseTemperaturesIntention, SenseBoilerHeatGoal, SenseBoilerHeatIntention, HeatWaterGoal, HeatSolarIntention, HeatGasIntention }
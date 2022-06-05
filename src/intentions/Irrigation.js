const Goal = require('../bdi/Goal');
const Intention = require('../bdi/Intention');
const Clock = require('../utils/Clock');

class SenseHumidityGoal extends Goal {
}

class SenseHumidityIntention extends Intention {
    static applicable(goal) {
        return goal instanceof SenseHumidityGoal
    }

    *exec({ probe } = parameters) {
        while (true) {
            let val = yield probe.notifyChange('value', 'irrigation')
            this.agent.beliefs.declare('humidity-high ' + probe.name, val > 50)
            this.agent.beliefs.declare('humidity-low ' + probe.name, val <= 50)
        }
    }
}

class SenseWeatherGoal extends Goal {
}

class SenseWeatherIntention extends Intention {
    static applicable(goal) {
        return goal instanceof SenseWeatherGoal
    }

    *exec({ probe } = parameters) {
        while (true) {
            let val = yield probe.notifyChange('value', 'irrigation')
            this.agent.beliefs.declare('rain-probability-high', val > 50)
            this.agent.beliefs.declare('rain-probability-low', val <= 50)
        }
    }
}

class IrrigationGoal extends Goal {
}

class IrrigationIntention extends Intention {
    static applicable(goal) {
        return goal instanceof IrrigationGoal
    }
    *exec({ hh, mm, irrigation, time } = parameters) {
        while (true) {
            yield Clock.global.notifyChange('mm', 'irrigation')
            if (Clock.global.hh == hh && Clock.global.mm == mm) {
                this.agent.postSubGoal(new IrrigateGoal({ irrigation: irrigation, time: time }))
            }
        }
    }
}

class IrrigateGoal extends Goal { }
class IrrigateIntention extends Intention {
    static applicable(goal) {
        return goal instanceof IrrigateGoal
    }
    *exec({ irrigation, time } = parameters) {
        //if it will rain do not irrigate
        if (this.agent.beliefs.check('rain-probability-high'))
            throw new Error('Failed, high rain probability')
        //if it is humid do not irrigate
        if (this.agent.beliefs.check('humidity-high ' + irrigation.name))
            throw new Error('Failed, high humidity')
        for (let i = 0; i < 10; i++) {
            if (this.agent.beliefs.check('room_occupied garden'))
                yield this.agent.beliefs.notifyChange('room_occupied garden')
            irrigation.openValve()
            let start = Clock.minutesFromStart()
            let irrigate = new Promise(async (resolve, reject) => {
                while (true) {
                    await Clock.global.notifyAnyChange()
                    if ((Clock.minutesFromStart() - start) >= time) {
                        resolve('irrigated')
                        break
                    }
                }
            })
            let occupied = this.agent.beliefs.notifyChange('room_occupied garden', 'irrigation')
            let value = yield Promise.race([irrigate, occupied])
            irrigation.closeValve()
            time -= (Clock.minutesFromStart() - start)
            if (value === 'irrigated') {
                break
            }
        }
    }
}



module.exports = { IrrigationGoal, IrrigationIntention, IrrigateGoal, IrrigateIntention, SenseHumidityGoal, SenseHumidityIntention, SenseWeatherGoal, SenseWeatherIntention }
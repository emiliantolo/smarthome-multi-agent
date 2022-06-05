const Goal = require("../bdi/Goal")
const Intention = require("../bdi/Intention")
const Clock = require("../utils/Clock")

class SenseLightsGoal extends Goal {
}

class SenseLightsIntention extends Intention {
    static applicable(goal) {
        return goal instanceof SenseLightsGoal
    }

    *exec({ lights } = parameters) {
        var lightsGoals = []
        for (let l of lights) {
            let lightGoalPromise = new Promise(async res => {
                while (true) {
                    let status = await l.notifyChange('status')
                    this.log('sense: light ' + l.name + ' switched ' + status)
                    this.agent.beliefs.declare('light_on ' + l.name, status == 'on')
                    this.agent.beliefs.declare('light_off ' + l.name, status == 'off')
                    this.agent.beliefs.declare('light_on_override ' + l.name, status == 'on_override')
                    this.agent.beliefs.declare('light_off_override ' + l.name, status == 'off_override')
                }
            });
            lightsGoals.push(lightGoalPromise)
        }
        yield Promise.all(lightsGoals)
    }
}

class SenseLightProbesGoal extends Goal {
}

class SenseLightProbesIntention extends Intention {
    static applicable(goal) {
        return goal instanceof SenseLightProbesGoal
    }

    *exec({ probes, min, max } = parameters) {
        var probesGoals = []
        for (let p of probes) {
            let probeGoalPromise = new Promise(async res => {
                while (true) {
                    let val = await p.notifyChange('value')
                    let status = ''
                    if (val > max) {
                        status = 'high'
                        this.log('sense: light_probe ' + p.name + ' switched ' + status)
                        this.agent.beliefs.declare('light_low ' + p.name, status == 'low')
                        this.agent.beliefs.declare('light_med ' + p.name, status == 'med')
                        this.agent.beliefs.declare('light_high ' + p.name, status == 'high')
                    } else if (min <= val && val <= max) {
                        status = 'med'
                        this.log('sense: light_probe ' + p.name + ' switched ' + status)
                        this.agent.beliefs.declare('light_low ' + p.name, status == 'low')
                        this.agent.beliefs.declare('light_med ' + p.name, status == 'med')
                        this.agent.beliefs.declare('light_high ' + p.name, status == 'high')
                    } else {
                        status = 'low'
                        this.log('sense: light_probe ' + p.name + ' switched ' + status)
                        this.agent.beliefs.declare('light_low ' + p.name, status == 'low')
                        this.agent.beliefs.declare('light_med ' + p.name, status == 'med')
                        this.agent.beliefs.declare('light_high ' + p.name, status == 'high')
                    }
                }
            });
            probesGoals.push(probeGoalPromise)
        }
        yield Promise.all(probesGoals)
    }
}

class TurnOnLightGoal extends Goal {
}

class TurnOnLightIntention extends Intention {
    static applicable(goal) {
        return goal instanceof TurnOnLightGoal
    }

    *exec({ light } = parameters) {
        if (this.agent.beliefs.check('light_on ' + light.name) || this.agent.beliefs.check('light_on_override ' + light.name) || this.agent.beliefs.check('light_off_override ' + light.name))
            throw new Error('Failed, light already on or overridden')
        return yield light.switchOnLight()
    }
}

class TurnOffLightGoal extends Goal {
}

class TurnOffLightIntention extends Intention {
    static applicable(goal) {
        return goal instanceof TurnOffLightGoal
    }

    *exec({ light } = parameters) {
        if (this.agent.beliefs.check('light_off ' + light.name) || this.agent.beliefs.check('light_on_override ' + light.name) || this.agent.beliefs.check('light_off_override ' + light.name))
            throw new Error('Failed, light already off or overridden')
        return yield light.switchOffLight()
    }
}

class LightsIntensityGoal extends Goal {
}

class LightsIntensityIntention extends Intention {
    static applicable(goal) {
        return goal instanceof LightsIntensityGoal
    }

    *exec({ lights, target } = parameters) {
        var lightsGoals = []
        for (let l of lights) {
            let lightGoalPromise = new Promise(async res => {
                while (true) {
                    let low = await this.agent.beliefs.notifyChange('light_low ' + l.name)
                    let med = await this.agent.beliefs.notifyChange('light_med ' + l.name)
                    let high = await this.agent.beliefs.notifyChange('light_high ' + l.name)
                    await Promise.race([low, med, high])
                    let probe = l.house.probes.lights[l.name + '_light_probe']
                    if (this.agent.beliefs.check('not light_on_override ' + l.name)) {
                        if (this.agent.beliefs.check('light_on ' + l.name)) {
                            l.setIntensity(l.intensity + target - probe.value)
                        } else {
                            l.setIntensity(target - probe.value)
                        }
                    }
                }
            });
            lightsGoals.push(lightGoalPromise)
        }
        yield Promise.all(lightsGoals)
    }
}

class ReturnToNormalGoal extends Goal {
}

class ReturnToNormalIntention extends Intention {
    static applicable(goal) {
        return goal instanceof ReturnToNormalGoal
    }
    *exec({ light, after } = parameters) {
        let start = Clock.minutesFromStart()
        let wait = new Promise(async (resolve, reject) => {
            while (true) {
                await Clock.global.notifyAnyChange()
                if ((Clock.minutesFromStart() - start) >= after) {
                    resolve('waited')
                    break
                }
            }
        })
        let occupation = this.agent.beliefs.notifyChange('room_occupied ' + light.name, 'rn')
        yield Promise.race([occupation, wait])
        if (this.agent.beliefs.check('room_occupied ' + light.name))
            throw new Error('Failed, room got occupied')
        light.switchOffLight()
    }
}

class LightOccupationGoal extends Goal {
}

class LightOccupationIntention extends Intention {
    static applicable(goal) {
        return goal instanceof LightOccupationGoal
    }

    *exec({ lights } = parameters) {
        var heatingsGoals = []
        for (let l of lights) {
            let heatingGoalPromise = new Promise(async res => {
                while (true) {
                    let status = await this.agent.beliefs.notifyChange('room_occupied ' + l.name, 'light')
                    let notOverridden = this.agent.beliefs.check('not light_on_override ' + l.name) && this.agent.beliefs.check('not light_off_override ' + l.name)
                    if (status) {
                        //room occupied
                        if (notOverridden) {
                            this.agent.postSubGoal(new TurnOnLightGoal({ light: l }))
                        }
                    } else {
                        //room not occupied
                        if (notOverridden) {
                            this.agent.postSubGoal(new TurnOffLightGoal({ light: l }))
                        } else {
                            this.agent.postSubGoal(new ReturnToNormalGoal({ light: l, after: 10 }))
                        }
                    }
                }
            });
            heatingsGoals.push(heatingGoalPromise)
        }
        yield Promise.all(heatingsGoals)
    }
}

module.exports = { SenseLightsGoal, SenseLightsIntention, SenseLightProbesGoal, SenseLightProbesIntention, LightsIntensityGoal, LightsIntensityIntention, TurnOnLightGoal, TurnOnLightIntention, TurnOffLightGoal, TurnOffLightIntention, ReturnToNormalGoal, ReturnToNormalIntention, LightOccupationGoal, LightOccupationIntention }
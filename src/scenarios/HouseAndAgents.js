const Boiler = require("../devices/Boiler")
const Curtains = require("../devices/Curtains")
const Heating = require("../devices/Heating")
const Irrigation = require("../devices/Irrigation")
const Light = require("../devices/Light")
const Vacuum = require("../devices/Vacuum")
const Person = require("../Observables/Person")
const Probe = require("../observables/Probe")
const Clock = require("../utils/Clock")
const Observable = require("../utils/Observable")
const Agent = require('../bdi/Agent')
const { SenseLightsGoal, SenseLightsIntention, SenseLightProbesGoal, SenseLightProbesIntention, ReturnToNormalIntention, LightOccupationIntention, LightOccupationGoal, TurnOnLightIntention, TurnOffLightIntention } = require('../intentions/Lights')
const { LightsIntensityIntention, LightsIntensityGoal } = require('../intentions/Lights')
const { SenseCurtainsIntention, SenseCurtainsGoal, OpenCurtainsGoal, OpenCurtainsIntention, CloseCurtainsIntention, CurtainsHouseOccupiedGoal, CurtainsHouseOccupiedIntention } = require('../intentions/Curtains')
const { SensePeopleIntention, SensePeopleGoal } = require('../intentions/Occupation')
const { CleanIntention, CleanGoal, SenseBatteryIntention, SenseBatteryGoal, Move, Clean1, Clean2, Charge, CleanRoomsIntention } = require('../intentions/Vacuum')
const { PostmanAcceptAllRequest, Postman, UpdateBeliefIntention, RequestBeliefIntention, RequestBeliefChangeIntention } = require('../intentions/PostMan')
const { IrrigationIntention, IrrigationGoal, IrrigateIntention, SenseHumidityIntention, SenseHumidityGoal, SenseWeatherIntention, SenseWeatherGoal } = require('../intentions/Irrigation')
const { SenseTemperaturesIntention, SenseBoilerHeatIntention, SenseBoilerHeatGoal, HeatSolarIntention, HeatGasIntention, SenseTemperaturesGoal } = require('../intentions/Boiler')
const { SenseHeatingsIntention, SenseHeatingsGoal, SenseTemperatureProbesGoal, SenseTemperatureProbesIntention, HeatRoomsIntention, HeatRoomsGoal, KeepHeatedOccupationGoal, KeepHeatedOccupationIntention, HeatUpIntention, HeatOccupationIntention, HeatOccupationGoal } = require('../intentions/Heating')

class House {
    constructor() {
        this.environment = {
            external_light: new Probe(this, 'light', 'external', 0),
            rain_probability: new Probe(this, 'weather', 'rain', 0)
        }
        this.people = {
            alice: new Person(this, 'Alice'),
            bob: new Person(this, 'Bob')
        }
        this.rooms = {
            kitchen: { name: 'kitchen', doors_to: ['livingroom'], cleaned: true },
            bedroom: { name: 'bedroom', doors_to: ['livingroom'], cleaned: true },
            bathroom: { name: 'bathroom', doors_to: ['livingroom'], cleaned: false },
            garage: { name: 'garage', doors_to: ['livingroom', 'garden'], cleaned: false },
            studio: { name: 'studio', doors_to: ['livingroom'], cleaned: true },
            entrance: { name: 'entrance', doors_to: ['livingroom', 'garden'], cleaned: true },
            garden: { name: 'garden', doors_to: ['entrance', 'garage'], cleaned: false },
            livingroom: { name: 'livingroom', doors_to: ['kitchen', 'entrance', 'studio', 'garage', 'bathroom', 'bedroom'], cleaned: true }
        }
        this.devices = {
            //lights
            lights: {
                kitchen_light: new Light(this, 'kitchen'),
                bedroom_light: new Light(this, 'bedroom'),
                bathroom_light: new Light(this, 'bathroom'),
                garage_light: new Light(this, 'garage'),
                studio_light: new Light(this, 'studio'),
                entrance_light: new Light(this, 'entrance'),
                garden_light: new Light(this, 'garden'),
                livingroom_light: new Light(this, 'livingroom')
            },
            //heating
            heatings: {
                kitchen_heating: new Heating(this, 'kitchen'),
                bedroom_heating: new Heating(this, 'bedroom'),
                bathroom_heating: new Heating(this, 'bathroom'),
                studio_heating: new Heating(this, 'studio'),
                livingroom_heating: new Heating(this, 'livingroom')
            },
            //curtains
            curtains: {
                kitchen_curtains: new Curtains(this, 'kitchen'),
                livingroom_curtains: new Curtains(this, 'livingroom')
            },
            //vacuum
            vacuum_bot: new Vacuum(this, 'vacuumbot'),
            //irrigation
            garden_irrigation: {
                irrigation: new Irrigation(this, 'garden'),
                humidity_probe: new Probe(this, 'humidity', 'garden', 0)
            },
            //boiler
            water_heating: {
                boiler: new Boiler(this, 'boiler'),
                water_probe: new Probe(this, 'temperature', 'water', 50),
                solar_probe: new Probe(this, 'temperature', 'solar', 10)
            }
        }
        this.utilities = {
            electricity: new Observable({ consumption: 0 }),
            gas: new Observable({ consumption: 0 })
        }
        this.probes = {
            //light
            lights: {
                kitchen_light_probe: new Probe(this, 'light', 'kitchen', 0),
                bedroom_light_probe: new Probe(this, 'light', 'bedroom', 0),
                bathroom_light_probe: new Probe(this, 'light', 'bathroom', 0),
                garage_light_probe: new Probe(this, 'light', 'garage', 0),
                studio_light_probe: new Probe(this, 'light', 'studio', 0),
                entrance_light_probe: new Probe(this, 'light', 'entrance', 0),
                garden_light_probe: new Probe(this, 'light', 'garden', 0),
                livingroom_light_probe: new Probe(this, 'light', 'livingroom', 0)
            },
            //temperature
            temperatures: {
                kitchen_temperature_probe: new Probe(this, 'temperature', 'kitchen', 19),
                bedroom_temperature_probe: new Probe(this, 'temperature', 'bedroom', 19),
                bathroom_temperature_probe: new Probe(this, 'temperature', 'bathroom', 19),
                studio_temperature_probe: new Probe(this, 'temperature', 'studio', 19),
                livingroom_temperature_probe: new Probe(this, 'temperature', 'livingroom', 19)
            }
        }
    }
}

// House and agents
var house = new House()
var houseAgent = new Agent('houseagent')
var botAgent = new Agent('botagent')
botAgent.device = house.devices.vacuum_bot


// initial beliefset

//bot agent
botAgent.beliefs.declare('in-room livingroom')
botAgent.beliefs.declare('base livingroom')
botAgent.beliefs.declare('charge-high')
botAgent.beliefs.declare('door livingroom kitchen')
botAgent.beliefs.declare('door kitchen livingroom')
botAgent.beliefs.declare('door livingroom bedroom')
botAgent.beliefs.declare('door bedroom livingroom')
botAgent.beliefs.declare('door livingroom studio')
botAgent.beliefs.declare('door studio livingroom')
botAgent.beliefs.declare('door livingroom entrance')
botAgent.beliefs.declare('door entrance livingroom')
botAgent.beliefs.declare('room_occupied bedroom')
for (let r of Object.values(house.rooms)) {
    if (r.cleaned)
        botAgent.beliefs.declare('cleaned ' + r.name)
}

//house agent
houseAgent.beliefs.declare('room_occupied bedroom')
houseAgent.beliefs.declare('house_occupied')
houseAgent.beliefs.declare('boiler-temperature-high')
houseAgent.beliefs.declare('humidity-low garden')
houseAgent.beliefs.declare('rain-probability-low')
for (let r of Object.values(house.devices.heatings)) {
    houseAgent.beliefs.declare('heating_off ' + r.name)
}
for (let r of Object.values(house.devices.lights)) {
    houseAgent.beliefs.declare('light_off ' + r.name)
}
for (let r of Object.values(house.devices.curtains)) {
    houseAgent.beliefs.declare('curtain_up ' + r.name)
}
for (let p of Object.values(house.people)) {
    houseAgent.beliefs.declare('in_room ' + p.name + ' bedroom')
}
for (let r of Object.values(house.probes.lights)) {
    houseAgent.beliefs.declare('light_med ' + r.name)
}
for (let r of Object.values(house.probes.temperatures)) {
    houseAgent.beliefs.declare('temperature_med ' + r.name)
}


//goals and intentions

//postman
houseAgent.intentions.push(PostmanAcceptAllRequest)
houseAgent.postSubGoal(new Postman())
botAgent.intentions.push(PostmanAcceptAllRequest)
botAgent.postSubGoal(new Postman())
botAgent.intentions.push(UpdateBeliefIntention)
houseAgent.intentions.push(RequestBeliefIntention)
houseAgent.intentions.push(RequestBeliefChangeIntention)

//occupation
houseAgent.intentions.push(SensePeopleIntention)
houseAgent.postSubGoal(new SensePeopleGoal({ people: Object.values(house.people) }))

//lights
houseAgent.intentions.push(SenseLightsIntention)
houseAgent.postSubGoal(new SenseLightsGoal({ lights: Object.values(house.devices.lights) }))
houseAgent.intentions.push(SenseLightProbesIntention)
houseAgent.postSubGoal(new SenseLightProbesGoal({ probes: Object.values(house.probes.lights), min: 50, max: 80 }))
houseAgent.intentions.push(LightsIntensityIntention)
houseAgent.postSubGoal(new LightsIntensityGoal({ lights: Object.values(house.devices.lights), target: 75 }))
houseAgent.intentions.push(TurnOnLightIntention)
houseAgent.intentions.push(TurnOffLightIntention)
houseAgent.intentions.push(ReturnToNormalIntention)
houseAgent.intentions.push(LightOccupationIntention)
houseAgent.postSubGoal(new LightOccupationGoal({ lights: Object.values(house.devices.lights) }))

//heatings
houseAgent.intentions.push(SenseTemperatureProbesIntention)
houseAgent.postSubGoal(new SenseTemperatureProbesGoal({ probes: Object.values(house.probes.temperatures), low: 17.5, med: 18.5, high: 21.5 }))
houseAgent.intentions.push(SenseHeatingsIntention)
houseAgent.postSubGoal(new SenseHeatingsGoal({ heatings: Object.values(house.devices.heatings) }))
houseAgent.intentions.push(HeatRoomsIntention)
houseAgent.postSubGoal(new HeatRoomsGoal({ heatings: Object.values(house.devices.heatings) }))
houseAgent.intentions.push(HeatUpIntention)
houseAgent.intentions.push(KeepHeatedOccupationIntention)
houseAgent.intentions.push(HeatOccupationIntention)
houseAgent.postSubGoal(new HeatOccupationGoal({ heatings: Object.values(house.devices.heatings) }))

//curtains
houseAgent.intentions.push(SenseCurtainsIntention)
houseAgent.postSubGoal(new SenseCurtainsGoal({ curtains: Object.values(house.devices.curtains) }))
houseAgent.intentions.push(OpenCurtainsIntention)
houseAgent.intentions.push(CloseCurtainsIntention)
houseAgent.intentions.push(CurtainsHouseOccupiedIntention)
houseAgent.postSubGoal(new CurtainsHouseOccupiedGoal({ curtains: Object.values(house.devices.curtains) }))

//vacuum
botAgent.intentions.push(SenseBatteryIntention)
botAgent.postSubGoal(new SenseBatteryGoal)
let { OnlinePlanning } = require('../pddl/OnlinePlanner')([Move, Clean1, Clean2, Charge])
botAgent.intentions.push(OnlinePlanning)
botAgent.intentions.push(CleanRoomsIntention)
houseAgent.intentions.push(CleanIntention)
houseAgent.postSubGoal(new CleanGoal({ hh: 14, mm: 0, rooms: ['livingroom', 'kitchen', 'bedroom', 'studio', 'entrance'] }))

//irrigation
houseAgent.intentions.push(SenseHumidityIntention)
houseAgent.postSubGoal(new SenseHumidityGoal({ probe: house.devices.garden_irrigation.humidity_probe }))
houseAgent.intentions.push(SenseWeatherIntention)
houseAgent.postSubGoal(new SenseWeatherGoal({ probe: house.environment.rain_probability }))
houseAgent.intentions.push(IrrigationIntention)
houseAgent.postSubGoal(new IrrigationGoal({ hh: 21, mm: 0, irrigation: house.devices.garden_irrigation.irrigation, time: 15 }))
houseAgent.intentions.push(IrrigateIntention)

//boiler
houseAgent.intentions.push(SenseTemperaturesIntention)
houseAgent.postSubGoal(new SenseTemperaturesGoal({ water_heating: house.devices.water_heating }))
houseAgent.intentions.push(SenseBoilerHeatIntention)
houseAgent.postSubGoal(new SenseBoilerHeatGoal({ water_heating: house.devices.water_heating }))
houseAgent.intentions.push(HeatSolarIntention)
houseAgent.intentions.push(HeatGasIntention)
houseAgent.intentions.push(HeatRoomsIntention)
houseAgent.postSubGoal(new HeatRoomsGoal({ heatings: Object.values(house.devices.heatings) }))


//environment simulation

//simulate weather
Clock.global.observe('mm', () => {
    var time = Clock.global
    if (time.dd == 0 && time.hh == 0 && time.mm == 0) {
        house.environment.rain_probability.setValue(20)
        house.devices.garden_irrigation.humidity_probe.setValue(20)
    }
    if (time.dd == 1 && time.hh == 0 && time.mm == 0) {
        house.environment.rain_probability.setValue(80)
        house.devices.garden_irrigation.humidity_probe.setValue(20)
    }
    if (time.dd == 2 && time.hh == 0 && time.mm == 0) {
        house.environment.rain_probability.setValue(20)
        house.devices.garden_irrigation.humidity_probe.setValue(80)
    }
})

//simulate temperature
let last = 0
Clock.global.observe('mm', () => {
    let t = Clock.minutesFromStart()
    if ((t - last) >= 30) {
        for (let p of Object.values(house.probes.temperatures)) {
            if (house.devices.heatings[p.name + '_heating'].status == 'off')
                p.increaseValue(-0.5)
        }
        last = t
    }
})

//simulate light
let updateLightValue = (probe) => {

    let light = house.devices.lights[probe.name + '_light']
    let curtains = house.devices.curtains[probe.name + '_curtains']

    let l = 0
    let lint = 0
    let curt = 1

    if (light) {
        l = light.status === 'on' ? 1 : 0
        lint = light.intensity
    }

    if (curtains) {
        curt = curtains.status === 'up' ? 1 : 0
    }

    probe.setValue(curt * house.environment.external_light.value + l * lint)
}

Clock.global.observe('mm', (mm) => {
    var time = Clock.global
    if (time.hh == 6 && time.mm == 0) {
        house.environment.external_light.setValue(25)
        for (let p of Object.values(house.probes.lights)) {
            updateLightValue(p)
        }
    }
    if (time.hh == 7 && time.mm == 0) {
        house.environment.external_light.setValue(50)
        for (let p of Object.values(house.probes.lights)) {
            updateLightValue(p)
        }
    }
    if (time.hh == 8 && time.mm == 0) {
        house.environment.external_light.setValue(75)
        for (let p of Object.values(house.probes.lights)) {
            updateLightValue(p)
        }
    }
    if (time.hh == 9 && time.mm == 0) {
        house.environment.external_light.setValue(100)
        for (let p of Object.values(house.probes.lights)) {
            updateLightValue(p)
        }
    }
    if (time.hh == 16 && time.mm == 0) {
        house.environment.external_light.setValue(75)
        for (let p of Object.values(house.probes.lights)) {
            updateLightValue(p)
        }
    }
    if (time.hh == 17 && time.mm == 0) {
        house.environment.external_light.setValue(50)
        for (let p of Object.values(house.probes.lights)) {
            updateLightValue(p)
        }
    }
    if (time.hh == 18 && time.mm == 0) {
        house.environment.external_light.setValue(25)
        for (let p of Object.values(house.probes.lights)) {
            updateLightValue(p)
        }
    }
    if (time.hh == 19 && time.mm == 0) {
        house.environment.external_light.setValue(0)
        for (let p of Object.values(house.probes.lights)) {
            updateLightValue(p)
        }
    }
})

//simulate hot water usage
for (let p of Object.values(house.people)) {
    p.observe('in_room', () => {
        if (p.in_room === 'kitchen')
            house.devices.water_heating.water_probe.increaseValue(-5)
        if (p.in_room === 'bathroom')
            house.devices.water_heating.water_probe.increaseValue(-10)
    })
}

//simulate solar water
Clock.global.observe('mm', (mm) => {
    var time = Clock.global
    if (time.hh == 8 && time.mm == 0) {
        house.devices.water_heating.solar_probe.increaseValue(20)
    }
    if (time.hh == 9 && time.mm == 0) {
        house.devices.water_heating.solar_probe.increaseValue(20)
    }
    if (time.hh == 10 && time.mm == 0) {
        house.devices.water_heating.solar_probe.increaseValue(20)
    }
    if (time.hh == 11 && time.mm == 0) {
        house.devices.water_heating.solar_probe.increaseValue(20)
    }
    if (time.hh == 16 && time.mm == 0) {
        house.devices.water_heating.solar_probe.increaseValue(-20)
    }
    if (time.hh == 17 && time.mm == 0) {
        house.devices.water_heating.solar_probe.increaseValue(-20)
    }
    if (time.hh == 18 && time.mm == 0) {
        house.devices.water_heating.solar_probe.increaseValue(-20)
    }
    if (time.hh == 19 && time.mm == 0) {
        house.devices.water_heating.solar_probe.increaseValue(-20)
    }
})

module.exports = { house, houseAgent, botAgent }
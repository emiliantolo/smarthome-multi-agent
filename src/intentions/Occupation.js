const Goal = require("../bdi/Goal")
const Intention = require("../bdi/Intention")

class SensePeopleGoal extends Goal {
}

class SensePeopleIntention extends Intention {
    static applicable(goal) {
        return goal instanceof SensePeopleGoal
    }

    *exec({ people } = parameters) {
        var peopleGoals = []
        for (let p of people) {

            let peopleGoalPromise = new Promise(async res => {
                while (true) {
                    let room = await p.notifyChange('in_room')
                    this.log('sense: person ' + p.name + ' in room ' + room)
                    for (let k in p.house.rooms) {
                        this.agent.beliefs.declare('in_room ' + p.name + ' ' + p.house.rooms[k].name, p.house.rooms[k].name == room)
                        let inRoom = false
                        for (let pp of people) {
                            inRoom = inRoom || this.agent.beliefs.check('in_room ' + pp.name + ' ' + p.house.rooms[k].name)
                        }
                        this.agent.beliefs.declare('room_occupied ' + p.house.rooms[k].name, inRoom)
                    }
                    let inHouse = false
                    for (let k in p.house.rooms) {
                        inHouse = inHouse || this.agent.beliefs.check('room_occupied ' + p.house.rooms[k].name)
                    }
                    this.agent.beliefs.declare('house_occupied', inHouse)
                }
            });
            peopleGoals.push(peopleGoalPromise)
        }
        yield Promise.all(peopleGoals)
    }
}

module.exports = { SensePeopleGoal, SensePeopleIntention }
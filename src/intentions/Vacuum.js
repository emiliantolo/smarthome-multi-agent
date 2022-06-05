const Goal = require('../bdi/Goal');
const Intention = require('../bdi/Intention');
const MessageDispatcher = require('../observables/MessageDispatcher');
const pddlActionIntention = require('../pddl/actions/pddlActionIntention');
const PddlGoal = require('../pddl/PlanningGoal');
const Clock = require('../utils/Clock');
const { RequestBeliefGoal, RequestBeliefChangeGoal } = require('./PostMan');

class CleanGoal extends Goal {
}

class CleanIntention extends Intention {
    static applicable(goal) {
        return goal instanceof CleanGoal
    }
    *exec({ rooms } = parameters) {
        while (true) {
            yield Clock.global.notifyChange('mm', 'clean')
            if (Clock.global.hh == this.goal.parameters.hh && Clock.global.mm == this.goal.parameters.mm) {
                yield MessageDispatcher.authenticate(this.agent).sendTo('botagent', new CleanRoomsGoal({ rooms: rooms }))
            }
        }
    }
}


class CleanRoomsGoal extends Goal { }
class CleanRoomsIntention extends Intention {
    static applicable(goal) {
        return goal instanceof CleanRoomsGoal
    }
    *exec({ rooms } = parameters) {
        //force clean
        for (let r of rooms) {
            this.agent.beliefs.declare('cleaned ' + r, false)
        }
        for (let i = 0; i < 10; i++) {
            let cleanGoals = []
            let notCleanedRooms = []
            for (let r of rooms) {
                if (this.agent.beliefs.check('not cleaned ' + r)) {
                    notCleanedRooms.push(r)
                }
            }
            if (notCleanedRooms.length == 0) {
                return;
            }
            for (let r of notCleanedRooms) {
                //ask for occupation
                yield MessageDispatcher.authenticate(this.agent).sendTo('houseagent', new RequestBeliefGoal({ agent: 'botagent', belief: 'room_occupied ' + r }))
                yield new Promise(res => setTimeout(res, 0))
                if (this.agent.beliefs.check('not room_occupied ' + r)) {
                    cleanGoals.push('cleaned ' + r)
                }
            }

            if (cleanGoals.length == 0) {
                //ask for change
                for (let r of notCleanedRooms) {
                    MessageDispatcher.authenticate(this.agent).sendTo('houseagent', new RequestBeliefChangeGoal({ agent: 'botagent', belief: 'room_occupied ' + r }))
                }
                //wait for change
                yield this.agent.beliefs.notifyAnyChange()
            } else {
                yield this.agent.postSubGoal(new PddlGoal({ goal: cleanGoals.concat(['charge-high']) }))
            }
        }
        //if fails after max number of attempts return charging
        yield this.agent.postSubGoal(new PddlGoal({ goal: ['charge-high'] }))
    }
}

class Move extends pddlActionIntention {
    static parameters = ['from', 'to'];
    static precondition = [['in-room', 'from'], ['door', 'from', 'to']];
    static effect = [['not in-room', 'from'], ['in-room', 'to']];
    *exec({ from, to } = parameters) {
        if (this.checkPrecondition()) {
            yield this.agent.device.moveToRoom(to)
            this.applyEffect()
        } else {
            throw new Error('pddl precondition not valid'); //Promise is rejected!
        }
    }
}

class Clean1 extends pddlActionIntention {
    static parameters = ['r'];
    static precondition = [['in-room', 'r'], ['not room_occupied', 'r'], ['charge-high']];
    static effect = [['cleaned', 'r'], ['charge-med'], ['not charge-high']];
    *exec({ r } = parameters) {
        yield MessageDispatcher.authenticate(this.agent).sendTo('houseagent', new RequestBeliefGoal({ agent: 'botagent', belief: 'room_occupied ' + r }))
        yield new Promise(res => setTimeout(res, 0))
        if (this.checkPrecondition()) {
            this.applyEffect()
            yield this.agent.device.clean()
        } else {
            throw new Error('pddl precondition not valid'); //Promise is rejected!
        }
    }
}

class Clean2 extends pddlActionIntention {
    static parameters = ['r'];
    static precondition = [['in-room', 'r'], ['not room_occupied', 'r'], ['charge-med']];
    static effect = [['cleaned', 'r'], ['charge-low'], ['not charge-med']];
    *exec({ r } = parameters) {
        yield MessageDispatcher.authenticate(this.agent).sendTo('houseagent', new RequestBeliefGoal({ agent: 'botagent', belief: 'room_occupied ' + r }))
        yield new Promise(res => setTimeout(res, 0))
        if (this.checkPrecondition()) {
            this.applyEffect()
            yield this.agent.device.clean()
        } else {
            throw new Error('pddl precondition not valid'); //Promise is rejected!
        }
    }
}

class Charge extends pddlActionIntention {
    static parameters = ['r'];
    static precondition = [['in-room', 'r'], ['base', 'r']];
    static effect = [['charge-high'], ['not charge-low'], ['not charge-med']];
    *exec({ r } = parameters) {
        if (this.checkPrecondition()) {
            this.applyEffect()
            yield this.agent.device.charge()
        } else {
            throw new Error('pddl precondition not valid'); //Promise is rejected!
        }
    }
}

class SenseBatteryGoal extends Goal {
}

class SenseBatteryIntention extends Intention {
    static applicable(goal) {
        return goal instanceof SenseBatteryGoal
    }

    *exec() {
        while (true) {
            let level = yield this.agent.device.notifyChange('battery')
            this.agent.beliefs.declare('charge-high', level >= 80)
            this.agent.beliefs.declare('charge-med', level > 30 && level < 80)
            this.agent.beliefs.declare('charge-low', level <= 30)
        }
    }

}

module.exports = { CleanGoal, CleanIntention, SenseBatteryGoal, SenseBatteryIntention, CleanRoomsGoal, CleanRoomsIntention, Move, Clean1, Clean2, Charge }
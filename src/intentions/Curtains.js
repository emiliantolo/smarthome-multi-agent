const Goal = require("../bdi/Goal")
const Intention = require("../bdi/Intention")

class SenseCurtainsGoal extends Goal {
}

class SenseCurtainsIntention extends Intention {
    static applicable(goal) {
        return goal instanceof SenseCurtainsGoal
    }

    *exec({ curtains } = parameters) {
        var curtainsGoals = []
        for (let c of curtains) {
            let curtainsGoalPromise = new Promise(async res => {
                while (true) {
                    let status = await c.notifyChange('status')
                    this.agent.beliefs.declare('curtain_up ' + c.name, status == 'up')
                    this.agent.beliefs.declare('curtain_down ' + c.name, status == 'down')
                }
            });
            curtainsGoals.push(curtainsGoalPromise)
        }
        yield Promise.all(curtainsGoals)
    }
}

class OpenCurtainsGoal extends Goal {
}

class OpenCurtainsIntention extends Intention {
    static applicable(goal) {
        return goal instanceof OpenCurtainsGoal
    }

    *exec({ curtain } = parameters) {
        if (this.agent.beliefs.check('curtain_up ' + curtain.name))
            throw new Error('Failed, curtain already opened')
        return yield curtain.openCurtains()
    }
}

class CloseCurtainsGoal extends Goal {
}

class CloseCurtainsIntention extends Intention {
    static applicable(goal) {
        return goal instanceof CloseCurtainsGoal
    }

    *exec({ curtain } = parameters) {
        if (this.agent.beliefs.check('curtain_down ' + curtain.name))
            throw new Error('Failed, curtain already closed')
        yield curtain.closeCurtains()
    }
}

class CurtainsHouseOccupiedGoal extends Goal {
}

class CurtainsHouseOccupiedIntention extends Intention {
    static applicable(goal) {
        return goal instanceof CurtainsHouseOccupiedGoal
    }

    *exec({ curtains } = parameters) {
        while (true) {
            let status = yield this.agent.beliefs.notifyChange('house_occupied')
            if (status) {
                for (let c of curtains) {
                    this.agent.postSubGoal(new OpenCurtainsGoal({ curtain: c }))
                }
            } else {
                for (let c of curtains) {
                    this.agent.postSubGoal(new CloseCurtainsGoal({ curtain: c }))
                }
            }
        }
    }
}

module.exports = { SenseCurtainsGoal, SenseCurtainsIntention, OpenCurtainsGoal, OpenCurtainsIntention, CloseCurtainsGoal, CloseCurtainsIntention, CurtainsHouseOccupiedGoal, CurtainsHouseOccupiedIntention }
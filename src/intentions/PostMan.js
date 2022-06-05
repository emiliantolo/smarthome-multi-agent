const Goal = require("../bdi/Goal")
const Intention = require("../bdi/Intention")
const MessageDispatcher = require("../observables/MessageDispatcher")

class Postman extends Goal {
}

class PostmanAcceptAllRequest extends Intention {
    static applicable(goal) {
        return goal instanceof Postman
    }
    *exec(parameters) {
        var myMessageDispatcher = MessageDispatcher.authenticate(this.agent)
        while (true) {
            yield myMessageDispatcher.notifyChange('newMessageReceived')
            let newMessage = myMessageDispatcher.readMessage()
            if (newMessage && newMessage instanceof Goal) {
                this.log('Reading received message', newMessage.toString())
                // console.log(newMessage)
                //yield this.agent.postSubGoal(newMessage)
                this.agent.postSubGoal(newMessage)
            }
        }
    }
}

class RequestBeliefGoal extends Goal {
}

class RequestBeliefIntention extends Intention {
    static applicable(goal) {
        return goal instanceof RequestBeliefGoal
    }
    *exec({ belief, agent } = this.goal.parameters) {
        let value = this.agent.beliefs.check(belief)
        yield MessageDispatcher.authenticate(this.agent).sendTo(agent, new UpdateBeliefGoal({ belief: belief, value: value }))
    }
}

class UpdateBeliefGoal extends Goal {
}

class UpdateBeliefIntention extends Intention {
    static applicable(goal) {
        return goal instanceof UpdateBeliefGoal
    }
    *exec({ belief, value } = this.goal.parameters) {
        this.agent.beliefs.declare(belief, value)
    }
}

class RequestBeliefChangeGoal extends Goal {
}

class RequestBeliefChangeIntention extends Intention {
    static applicable(goal) {
        return goal instanceof RequestBeliefChangeGoal
    }
    *exec({ belief, agent } = this.goal.parameters) {
        let value = yield this.agent.beliefs.notifyChange(belief, agent)
        yield MessageDispatcher.authenticate(this.agent).sendTo(agent, new UpdateBeliefGoal({ belief: belief, value: value }))
    }
}

module.exports = { Postman, PostmanAcceptAllRequest, UpdateBeliefGoal, UpdateBeliefIntention, RequestBeliefGoal, RequestBeliefIntention, RequestBeliefChangeGoal, RequestBeliefChangeIntention }
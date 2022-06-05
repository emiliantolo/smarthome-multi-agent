const Observable = require("../utils/Observable")

class MessageDispatcher extends Observable {

    static #dispatchers = {}
    static authenticate(senderAgent) {
        if (!(senderAgent.name in this.#dispatchers))
            this.#dispatchers[senderAgent.name] = new MessageDispatcher(senderAgent.name)
        return this.#dispatchers[senderAgent.name]
    }

    constructor(name) {
        super({ newMessageReceived: false })
        this.name = name
        this.received = []
    }

    pushMessage(goal) {
        this.newMessageReceived = true
        this.received.push(goal)
    }

    readMessage() {
        this.newMessageReceived = false
        return this.received.pop()
    }

    async sendTo(to, goal) {
        if (!to in this.constructor.#dispatchers)
            this.constructor.#dispatchers[to] = new MessageDispatcher(to)
        this.constructor.#dispatchers[to].pushMessage(goal)
        return goal.notifyChange('achieved')
    }

}

module.exports = MessageDispatcher
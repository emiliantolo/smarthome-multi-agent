;; domain file: vacuum_domain.pddl
(define (domain vacuumbot)
    (:requirements :strips)
    (:predicates
        (in-room ?from)
        (door ?from ?to)
        (room_occupied ?r)
        (cleaned ?r)
        (base ?r)
        (charge-high)
        (charge-med)
        (charge-low)
    )
    (:action Move
        :parameters (?from ?to)
        :precondition (and (in-room ?from) (door ?from ?to))
        :effect (and (not (in-room ?from)) (in-room ?to))
    )
    (:action Clean1
        :parameters (?r)
        :precondition (and (in-room ?r) (not (room_occupied ?r)) (charge-high))
        :effect (and (cleaned ?r) (charge-med) (not (charge-high)))
    )
    (:action Clean2
        :parameters (?r)
        :precondition (and (in-room ?r) (not (room_occupied ?r)) (charge-med))
        :effect (and (cleaned ?r) (charge-low) (not (charge-med)))
    )
    (:action Charge
        :parameters (?r)
        :precondition (and (in-room ?r) (base ?r))
        :effect (and (charge-high) (not (charge-low)) (not (charge-med)))
    )
)

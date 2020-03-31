
import {InsightDatasetKind} from "../src/controller/IInsightFacade";
import {expect} from "chai";
import Scheduler from "../src/scheduler/Scheduler";

/*

let sections = [
    {
        "courses_dept": "cpsc",
        "courses_id": "340",
        "courses_uuid": "1319",
        "courses_pass": 101,
        "courses_fail": 7,
        "courses_audit": 2
    },
    {
        "courses_dept": "cpsc",
        "courses_id": "340",
        "courses_uuid": "3397",
        "courses_pass": 171,
        "courses_fail": 3,
        "courses_audit": 1
    },
    {
        "courses_dept": "cpsc",
        "courses_id": "344",
        "courses_uuid": "62413",
        "courses_pass": 93,
        "courses_fail": 2,
        "courses_audit": 0
    },
    {
        "courses_dept": "cpsc",
        "courses_id": "344",
        "courses_uuid": "72385",
        "courses_pass": 43,
        "courses_fail": 1,
        "courses_audit": 0
    }
];

let rooms = [
    {
        "rooms_shortname": "AERL",
        "rooms_number": "120",
        "rooms_seats": 144,
        "rooms_lat": 49.26372,
        "rooms_lon": -123.25099
    },
    {
        "rooms_shortname": "ALRD",
        "rooms_number": "105",
        "rooms_seats": 94,
        "rooms_lat": 49.2699,
        "rooms_lon": -123.25318
    },
    {
        "rooms_shortname": "ANGU",
        "rooms_number": "098",
        "rooms_seats": 260,
        "rooms_lat": 49.26486,
        "rooms_lon": -123.25364
    },
    {
        "rooms_shortname": "BUCH",
        "rooms_number": "A101",
        "rooms_seats": 275,
        "rooms_lat": 49.26826,
        "rooms_lon": -123.25468
    }
];

let sections16 = [
    {
        "courses_dept": "cpsc",
        "courses_id": "340",
        "courses_uuid": "1319",
        "courses_pass": 101,
        "courses_fail": 7,
        "courses_audit": 2
    },
    {
        "courses_dept": "cpsc",
        "courses_id": "340",
        "courses_uuid": "3397",
        "courses_pass": 101,
        "courses_fail": 3,
        "courses_audit": 1
    },
    {
        "courses_dept": "cpsc",
        "courses_id": "344",
        "courses_uuid": "62413",
        "courses_pass": 93,
        "courses_fail": 2,
        "courses_audit": 0
    },
    {
        "courses_dept": "cpsc",
        "courses_id": "344",
        "courses_uuid": "72385",
        "courses_pass": 43,
        "courses_fail": 1,
        "courses_audit": 0
    },
    {
        "courses_dept": "cpsc",
        "courses_id": "340",
        "courses_uuid": "13119",
        "courses_pass": 101,
        "courses_fail": 7,
        "courses_audit": 2
    },
    {
        "courses_dept": "cpsc",
        "courses_id": "340",
        "courses_uuid": "32397",
        "courses_pass": 101,
        "courses_fail": 3,
        "courses_audit": 1
    },
    {
        "courses_dept": "cpsc",
        "courses_id": "3244",
        "courses_uuid": "62413",
        "courses_pass": 93,
        "courses_fail": 2,
        "courses_audit": 0
    },
    {
        "courses_dept": "cpsc",
        "courses_id": "3434",
        "courses_uuid": "72385",
        "courses_pass": 43,
        "courses_fail": 1,
        "courses_audit": 0
    },
    {
        "courses_dept": "cpsc",
        "courses_id": "340",
        "courses_uuid": "13119",
        "courses_pass": 101,
        "courses_fail": 7,
        "courses_audit": 2
    },
    {
        "courses_dept": "cpsc",
        "courses_id": "340",
        "courses_uuid": "33197",
        "courses_pass": 101,
        "courses_fail": 3,
        "courses_audit": 1
    },
    {
        "courses_dept": "cpsc",
        "courses_id": "344",
        "courses_uuid": "621413",
        "courses_pass": 93,
        "courses_fail": 2,
        "courses_audit": 0
    },
    {
        "courses_dept": "cpsc",
        "courses_id": "344",
        "courses_uuid": "721385",
        "courses_pass": 43,
        "courses_fail": 1,
        "courses_audit": 0
    }, {
        "courses_dept": "cpsc",
        "courses_id": "340",
        "courses_uuid": "13019",
        "courses_pass": 101,
        "courses_fail": 7,
        "courses_audit": 2
    },
    {
        "courses_dept": "cpsc",
        "courses_id": "340",
        "courses_uuid": "33097",
        "courses_pass": 101,
        "courses_fail": 3,
        "courses_audit": 1
    },
    {
        "courses_dept": "cpsc",
        "courses_id": "344",
        "courses_uuid": "624013",
        "courses_pass": 93,
        "courses_fail": 2,
        "courses_audit": 0
    },
    {
        "courses_dept": "cpsc",
        "courses_id": "344",
        "courses_uuid": "720385",
        "courses_pass": 43,
        "courses_fail": 1,
        "courses_audit": 0
    }];


it("basic schedule test", function () {
    let scheduler: Scheduler = new Scheduler();
    scheduler.schedule(sections, rooms);

});

let farRooms = [
    {
        "rooms_shortname": "AERL",
        "rooms_number": "120",
        "rooms_seats": 144,
        "rooms_lat": 49.26372,
        "rooms_lon": -123.25099
    },
    {
        "rooms_shortname": "ALRD",
        "rooms_number": "105",
        "rooms_seats": 94,
        "rooms_lat": 49.4699,
        "rooms_lon": -123.25318
    },
    {
        "rooms_shortname": "ALFRD",
        "rooms_number": "105",
        "rooms_seats": 94,
        "rooms_lat": 49.2399,
        "rooms_lon": -123.25318
    },
    {
        "rooms_shortname": "ALERD",
        "rooms_number": "105",
        "rooms_seats": 94,
        "rooms_lat": 49.2499,
        "rooms_lon": -123.25318
    },
    {
        "rooms_shortname": "ANGU",
        "rooms_number": "098",
        "rooms_seats": 260,
        "rooms_lat": 49.26486,
        "rooms_lon": -123.25364
    }

];

it("Test for too many sections for one room", function () {
    let scheduler: Scheduler = new Scheduler();
    scheduler.schedule(sections16, rooms);

});

it("Tests for first room very far from others", function() {
    let scheduler: Scheduler = new Scheduler();
    scheduler.schedule(sections16, farRooms);
});

*/


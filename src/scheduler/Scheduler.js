"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Scheduler {
    initialize(sections, rooms) {
        this.coursesInTS = new Array(15);
        this.alreadyScheduledSections = new Set();
        this.roomsDictionary = {};
        for (let i = 0; i < 15; i++) {
            this.coursesInTS[i] = new Set();
        }
        this.maxClassInRoom = {};
        this.roomsXtimeXsection = {};
        this.roomsUsed = new Set();
        for (let i of rooms) {
            this.roomsXtimeXsection[i.rooms_shortname + i.rooms_number] = new Array(15);
            this.roomsDictionary[i.rooms_shortname + i.rooms_number] = i;
            for (let j = 0; j < 15; j++) {
                this.roomsXtimeXsection[i.rooms_shortname + i.rooms_number][j] = false;
            }
        }
    }
    schedule(sections, rooms) {
        this.initialize(sections, rooms);
        let orderedRooms = this.prioritizeRoomsBySize(rooms);
        let unusedRooms = [];
        let orderedSections = this.prioritizeSections(sections);
        let result = [];
        let filledTimeSlots = 0;
        for (let i of orderedRooms) {
            filledTimeSlots = 0;
            let currRoom = i;
            this.maxClassInRoom[currRoom.rooms_shortname + currRoom.rooms_number] = 0;
            sectionsLoop: for (let j of orderedSections) {
                let currSection = j;
                if (!this.alreadyScheduledSections.has(currSection.courses_id + currSection.courses_uuid)) {
                    if (this.getSectionSize(currSection) > currRoom.rooms_seats) {
                        continue;
                    }
                    for (let t = 0; t < 15; t++) {
                        let key = currRoom.rooms_shortname + currRoom.rooms_number;
                        if (this.timeslotWorks(currSection, t, key)) {
                            filledTimeSlots++;
                            this.alreadyScheduledSections.add(currSection.courses_id + currSection.courses_uuid);
                            this.roomsXtimeXsection[key][t] = currSection;
                            this.roomsUsed.add(currRoom);
                            this.coursesInTS[t].add(currSection.courses_id);
                            if (this.getSectionSize(currSection) > this.maxClassInRoom[key]) {
                                this.maxClassInRoom[key] = this.getSectionSize(currSection);
                            }
                            break;
                        }
                        if (filledTimeSlots === 15) {
                            break sectionsLoop;
                        }
                    }
                }
            }
            if (filledTimeSlots === 0) {
                unusedRooms.push(currRoom);
            }
        }
        result = this.optimizeDistance(result, unusedRooms, Array.from(this.roomsUsed));
        return result;
    }
    timeslotWorks(section, timeslot, key) {
        return (!this.coursesInTS[timeslot].has(section.courses_id) && !this.roomsXtimeXsection[key][timeslot]);
    }
    getSectionSize(section) {
        return section.courses_audit + section.courses_fail + section.courses_pass;
    }
    getDistance(sourceRoom, destRoom) {
        let lat1 = sourceRoom.rooms_lat;
        let lat2 = destRoom.rooms_lat;
        let lon1 = sourceRoom.rooms_lon;
        let lon2 = destRoom.rooms_lon;
        let R = 6371;
        let dLat = this.deg2rad(lat2 - lat1);
        let dLon = this.deg2rad(lon2 - lon1);
        let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        let d = R * c;
        return d;
    }
    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
    prioritizeRoomsByDistanceFromSource(rooms, source) {
        let sortFunc = this.getSortFunction(source);
        return rooms.sort(sortFunc);
    }
    prioritizeRoomsBySize(rooms) {
        let compareFunc = ((a, b) => {
            if (a.rooms_seats > b.rooms_seats) {
                return 1;
            }
            if (a.rooms_seats < b.rooms_seats) {
                return -1;
            }
            else {
                return 0;
            }
        });
        return rooms.sort(compareFunc);
    }
    getSortFunction(sourceRoom) {
        return ((a, b) => {
            if (this.getDistance(sourceRoom, a) > this.getDistance(sourceRoom, b)) {
                return 1;
            }
            if (this.getDistance(sourceRoom, a) < this.getDistance(sourceRoom, b)) {
                return -1;
            }
            else {
                return 0;
            }
        });
    }
    prioritizeSections(sections) {
        let compareFunc = ((a, b) => {
            if (this.getSectionSize(a) > this.getSectionSize(b)) {
                return 1;
            }
            if (this.getSectionSize(a) < this.getSectionSize(b)) {
                return -1;
            }
            else {
                return 0;
            }
        });
        return sections.sort(compareFunc);
    }
    getMeanLat(rooms) {
        let res = 0;
        for (let room of rooms) {
            res += room.rooms_lat;
        }
        res = res / rooms.length;
        return res;
    }
    getMeanLon(rooms) {
        let res = 0;
        for (let room of rooms) {
            res += room.rooms_lon;
        }
        res = res / rooms.length;
        return res;
    }
    optimizeDistance(results, unusedRooms, roomsUsed) {
        let optimizedResult = [];
        let centrePseudoRoom = this.getCentreRoom(roomsUsed);
        let sortedUnusedRooms = this.prioritizeRoomsByDistanceFromSource(unusedRooms, centrePseudoRoom).reverse();
        let sortedUsedRooms = this.prioritizeRoomsByDistanceFromSource(roomsUsed, centrePseudoRoom);
        for (let i of roomsUsed) {
            let usedRoom = i;
            let usedRoomkey = usedRoom.rooms_shortname + usedRoom.rooms_number;
            let switchedRooms = new Set();
            roomsLoop: for (let j of unusedRooms) {
                let unusedRoom = j;
                let unusedRoomKey = unusedRoom.rooms_shortname + unusedRoom.rooms_number;
                if (!switchedRooms.has(unusedRoomKey)) {
                    if (this.canRoomsBeSwitched(usedRoomkey, unusedRoom)) {
                        if ((this.getDistance(centrePseudoRoom, unusedRoom) <
                            this.getDistance(centrePseudoRoom, usedRoom))) {
                            this.roomSwitch(usedRoom, unusedRoom);
                            switchedRooms.add(unusedRoomKey);
                        }
                        break roomsLoop;
                    }
                }
            }
        }
        optimizedResult = this.makeTupleFromMatrix();
        return optimizedResult;
    }
    canRoomsBeSwitched(usedRoomkey, unusedRoom) {
        return this.maxClassInRoom[usedRoomkey] <= unusedRoom.rooms_seats;
    }
    getCentreRoom(rooms) {
        let meanlat = this.getMeanLat(rooms);
        let meanlon = this.getMeanLon(rooms);
        let result = {
            rooms_shortname: "_____", rooms_number: "-1", rooms_seats: -1, rooms_lat: meanlat, rooms_lon: meanlon
        };
        return result;
    }
    roomSwitch(usedRoom, unusedRoom) {
        let usedRoomKey = usedRoom.rooms_shortname + usedRoom.rooms_number;
        let unusedRoomKey = unusedRoom.rooms_shortname + unusedRoom.rooms_number;
        for (let t = 0; t < 15; t++) {
            this.roomsXtimeXsection[unusedRoomKey][t] = this.roomsXtimeXsection[usedRoomKey][t];
            this.roomsXtimeXsection[usedRoomKey][t] = false;
        }
    }
    makeTupleFromMatrix() {
        let result = [];
        let section;
        let room;
        for (let roomkey in this.roomsXtimeXsection) {
            for (let t = 0; t < 15; t++) {
                if (this.roomsXtimeXsection[roomkey][t]) {
                    section = this.roomsXtimeXsection[roomkey][t];
                    room = this.roomsDictionary[roomkey];
                    result.push([room, section, Scheduler.timeSlots[t]]);
                }
            }
        }
        return result;
    }
}
exports.default = Scheduler;
Scheduler.timeSlots = ["MWF 0800-0900", "MWF 0900-1000", "MWF 1000-1100",
    "MWF 1100-1200", "MWF 1200-1300", "MWF 1300-1400",
    "MWF 1400-1500", "MWF 1500-1600", "MWF 1600-1700",
    "TR  0800-0930", "TR  0930-1100", "TR  1100-1230",
    "TR  1230-1400", "TR  1400-1530", "TR  1530-1700"];
//# sourceMappingURL=Scheduler.js.map
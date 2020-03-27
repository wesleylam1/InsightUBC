"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Scheduler {
    constructor() {
        this.alreadyScheduledSections = {};
    }
    initialize(sections, rooms) {
        this.coursesInTS = new Array(15);
        for (let i = 0; i < 15; i++) {
            this.coursesInTS[i] = new Set();
        }
        this.roomsXtime = [];
        this.roomsUsed = new Set();
        for (let i = 0; i < rooms.length; i++) {
            this.roomsXtime[i] = [];
            for (let j = 0; j < 15; j++) {
                this.roomsXtime[i][j] = false;
            }
        }
    }
    schedule(sections, rooms) {
        this.initialize(sections, rooms);
        let orderedRooms = this.prioritizeRoomsBySize(rooms);
        let orderedSections = this.prioritizeSections(sections);
        let result = [];
        let filledTimeSlots = 0;
        for (let i = 0; i < orderedRooms.length; i++) {
            filledTimeSlots = 0;
            this.currRoom = orderedRooms[i];
            sectionsLoop: for (let j in orderedSections) {
                this.currSection = orderedSections[j];
                if (this.getSectionSize(this.currSection) > this.currRoom.rooms_seats) {
                    continue;
                }
                for (let t = 0; t < 15; t++) {
                    if (this.timeslotWorks(this.currSection, t, i)) {
                        result.push([this.currRoom, this.currSection, Scheduler.timeSlots[t]]);
                        delete orderedSections[j];
                        this.roomsXtime[i][t] = true;
                        filledTimeSlots++;
                        this.roomsUsed.add(this.currRoom);
                        this.coursesInTS[t].add(this.currSection.courses_id);
                        break;
                    }
                    if (filledTimeSlots === 15) {
                        break sectionsLoop;
                    }
                }
            }
        }
        return result;
    }
    timeslotWorks(section, timeslot, roomIndex) {
        return (!this.coursesInTS[timeslot].has(section.courses_id) && !this.roomsXtime[roomIndex][timeslot]);
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
    prioritizeRoomsByDistance(rooms) {
        let source = rooms[0];
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
            if (this.getDistance(sourceRoom, a) < this.getDistance(sourceRoom, b)) {
                return -1;
            }
            if (this.getDistance(sourceRoom, a) > this.getDistance(sourceRoom, b)) {
                return 1;
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
}
exports.default = Scheduler;
Scheduler.timeSlots = ["MWF 0800-0900", "MWF 0900-1000", "MWF 1000-1100",
    "MWF 1100-1200", "MWF 1200-1300", "MWF 1300-1400",
    "MWF 1400-1500", "MWF 1500-1600", "MWF 1600-1700",
    "TR  0800-0930", "TR  0930-1100", "TR  1100-1230",
    "TR  1230-1400", "TR  1400-1530", "TR  1530-1700"];
//# sourceMappingURL=Scheduler.js.map
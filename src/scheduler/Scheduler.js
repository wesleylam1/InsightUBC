"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Scheduler {
    initialize(sections, rooms) {
        this.coursesInTS = new Array(15);
        for (let i = 0; i < 15; i++) {
            this.coursesInTS[i] = new Set();
        }
        this.maxClassInRoom = {};
        this.roomsXtime = [];
        this.roomsXsection = [];
        this.roomsUsed = [];
        for (let i = 0; i < rooms.length; i++) {
            this.roomsXtime[i] = [];
            this.roomsXsection[i] = [];
            for (let j = 0; j < 15; j++) {
                this.roomsXtime[i][j] = false;
                this.roomsXsection[i][j] = null;
            }
        }
    }
    schedule(sections, rooms) {
        this.initialize(sections, rooms);
        let orderedRooms = this.prioritizeRoomsBySize(rooms);
        let orderedSections = this.prioritizeSections(sections);
        let result = [];
        let filledTimeSlots = 0;
        roomsLoop: for (let i = 0; i < orderedRooms.length; i++) {
            filledTimeSlots = 0;
            let currRoom = orderedRooms[i];
            this.maxClassInRoom[currRoom.rooms_shortname + currRoom.rooms_number] = 0;
            sectionsLoop: for (let j in orderedSections) {
                let currSection = orderedSections[j];
                if (this.getSectionSize(this.currSection) > currRoom.rooms_seats) {
                    continue;
                }
                for (let t = 0; t < 15; t++) {
                    if (this.timeslotWorks(currSection, t, i)) {
                        delete orderedSections[j];
                        filledTimeSlots++;
                        this.roomsXtime[i][t] = orderedSections[j];
                        this.roomsXsection[i][t] = currSection;
                        this.roomsUsed.push(currRoom);
                        this.coursesInTS[t].add(currSection.courses_id);
                        if (this.getSectionSize(orderedSections[j]) >
                            this.maxClassInRoom[currRoom.rooms_shortname + currRoom.rooms_number]) {
                            this.maxClassInRoom[currRoom.rooms_shortname + currRoom.rooms_number]
                                = this.getSectionSize(currSection);
                        }
                        break;
                    }
                    if (filledTimeSlots === 15) {
                        delete orderedRooms[i];
                        break sectionsLoop;
                    }
                    if (orderedSections.length === 0) {
                        break roomsLoop;
                    }
                }
            }
        }
        result = this.optimizeDistance(result, orderedRooms, this.roomsUsed);
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
            if (this.getDistance(sourceRoom, a) < this.getDistance(sourceRoom, b)) {
                return 1;
            }
            if (this.getDistance(sourceRoom, a) > this.getDistance(sourceRoom, b)) {
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
    optimizeDistance(results, unusedRooms, roomsused) {
        let optimizedResult = [];
        let centrePseudoRoom = this.getCentreRoom(roomsused);
        let sortedUnusedRooms = this.prioritizeRoomsByDistanceFromSource(unusedRooms, centrePseudoRoom);
        let sortedResult = this.prioritizeTuplesByDistance(results, centrePseudoRoom);
        let length = sortedResult.length;
        return optimizedResult;
    }
    getCentreRoom(rooms) {
        let meanlat = this.getMeanLat(rooms);
        let meanlon = this.getMeanLon(rooms);
        let result = {
            rooms_shortname: "_____", rooms_number: "-1", rooms_seats: -1, rooms_lat: meanlat, rooms_lon: meanlon
        };
        return result;
    }
    prioritizeTuplesByDistance(results, source) {
        let compareFunc = ((a, b) => {
            if (this.getDistance(source, a[0]) < this.getDistance(source, b[0])) {
                return -1;
            }
            if (this.getDistance(source, a[0]) > this.getDistance(source, b[0])) {
                return 1;
            }
            else {
                return 0;
            }
        });
        return results.sort(compareFunc);
    }
}
exports.default = Scheduler;
Scheduler.timeSlots = ["MWF 0800-0900", "MWF 0900-1000", "MWF 1000-1100",
    "MWF 1100-1200", "MWF 1200-1300", "MWF 1300-1400",
    "MWF 1400-1500", "MWF 1500-1600", "MWF 1600-1700",
    "TR  0800-0930", "TR  0930-1100", "TR  1100-1230",
    "TR  1230-1400", "TR  1400-1530", "TR  1530-1700"];
//# sourceMappingURL=Scheduler.js.map
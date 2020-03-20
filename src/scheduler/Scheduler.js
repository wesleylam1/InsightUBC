"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Scheduler {
    constructor() {
        this.alreadyScheduledSections = {};
    }
    schedule(sections, rooms) {
        let orderedRooms = this.prioritizeRooms(rooms);
        let orderedSections = this.prioritizeSections(sections);
        this.roomsXtime = {};
        this.courseXtime = {};
        this.alreadyScheduledSections = {};
        let loopDone = false;
        let result = [];
        for (let room of orderedRooms) {
            let name = room.rooms_shortname + room.rooms_number;
            loopDone = false;
            this.roomsXtime[name] = new Set();
            while (!loopDone) {
                for (let i in orderedSections) {
                    let section = orderedSections[i];
                    if (this.canSchedule(room, section)) {
                        delete orderedSections[i];
                        result.push([room, section, this.currTime]);
                        this.courseXtime[section.courses_id].add(this.currTime);
                    }
                }
                loopDone = true;
            }
        }
        return result;
    }
    canSchedule(room, section) {
        return (this.doesSectionFitInRoom(section, room) && this.checkCourseTimes(section));
    }
    checkCourseTimes(section) {
        if (this.courseXtime.hasOwnProperty(section.courses_id)) {
            for (let time of Scheduler.timeSlots) {
                if (!this.courseXtime[section.courses_id].has(time)) {
                    this.currTime = time;
                    this.courseXtime[section.courses_id].add(time);
                    return true;
                }
            }
            return false;
        }
        else {
            this.courseXtime[section.courses_id] = new Set();
            this.courseXtime[section.courses_id].add(Scheduler.timeSlots[0]);
            return true;
        }
    }
    doesSectionFitInRoom(section, room) {
        let size = this.getSectionSize(section);
        return size <= room.rooms_seats;
    }
    getSectionSize(section) {
        return section.courses_audit + section.courses_fail + section.courses_pass;
    }
    getDistance(sourceRoom, destRoom) {
        let lat1 = sourceRoom.rooms_lat;
        let lat2 = destRoom.rooms_lat;
        let lon1 = sourceRoom.rooms_lon;
        let lon2 = destRoom.rooms_lon;
        let R = 6371000;
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
    prioritizeRooms(rooms) {
        let source = rooms[0];
        let sortFunc = this.getSortFunction(source);
        return rooms.sort(sortFunc);
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
                return -1;
            }
            if (this.getSectionSize(a) < this.getSectionSize(b)) {
                return 1;
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
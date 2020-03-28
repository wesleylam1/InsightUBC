
import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";

export default class Scheduler implements IScheduler {

    private static timeSlots: TimeSlot[] =
        ["MWF 0800-0900" , "MWF 0900-1000" , "MWF 1000-1100" ,
    "MWF 1100-1200" , "MWF 1200-1300" , "MWF 1300-1400" ,
    "MWF 1400-1500" , "MWF 1500-1600" , "MWF 1600-1700" ,
    "TR  0800-0930" , "TR  0930-1100" , "TR  1100-1230" ,
    "TR  1230-1400" , "TR  1400-1530" , "TR  1530-1700"];

    private roomsXtimeXsection: any;
    private currSection: SchedSection;
    private currRoom: SchedRoom;
    private coursesInTS: Array<Set<string>>;
    private roomsUsed: Set<SchedRoom>;
    private maxClassInRoom: any;
    private alreadyScheduledSections: Set<string>;
    private roomsDictionary: any;


    private initialize(sections: SchedSection[], rooms: SchedRoom[]): void {
        this.coursesInTS = new Array<Set<string>>(15);
        this.alreadyScheduledSections = new Set<string>();
        this.roomsDictionary = {};
        for (let i = 0; i < 15; i++) {
            this.coursesInTS[i] = new Set<string>();
        }
        this.maxClassInRoom = {};
        this.roomsXtimeXsection = {};
        this.roomsUsed = new Set<SchedRoom>();
        for (let i of rooms) {
            this.roomsXtimeXsection[i.rooms_shortname + i.rooms_number] = new Array<any>(15);
            this.roomsDictionary[i.rooms_shortname + i.rooms_number] = i;
            for (let j = 0; j < 15; j++) {
                this.roomsXtimeXsection[i.rooms_shortname + i.rooms_number][j] = false;
            }
        }
    }

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        this.initialize(sections, rooms);
        let orderedRooms = this.prioritizeRoomsBySize(rooms);
        let  unusedRooms: SchedRoom[] = [];
        let orderedSections = this.prioritizeSections(sections);
        let result: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
        let filledTimeSlots: number = 0;
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

    // returns true if room is not yet booked in given timeslot and no other section is taught in that timeslot
    private timeslotWorks(section: SchedSection, timeslot: number, key: any): boolean {
        return (!this.coursesInTS[timeslot].has(section.courses_id) && !this.roomsXtimeXsection[key][timeslot]);
    }

    private getSectionSize(section: SchedSection) {
        return section.courses_audit + section.courses_fail + section.courses_pass;
    }

    private getDistance(sourceRoom: SchedRoom, destRoom: SchedRoom) {
        let lat1 = sourceRoom.rooms_lat;
        let lat2 = destRoom.rooms_lat;
        let lon1 = sourceRoom.rooms_lon;
        let lon2 = destRoom.rooms_lon;
        let R = 6371; // Radius of the earth in km
        let dLat = this.deg2rad(lat2 - lat1);  // deg2rad below
        let dLon = this.deg2rad(lon2 - lon1);
        let a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        let d = R * c; // Distance in km
        return d;
    }

    private deg2rad(deg: any) {
        return deg * (Math.PI / 180);
    }

    private prioritizeRoomsByDistanceFromSource(rooms: SchedRoom[], source: SchedRoom): SchedRoom[] {
        let sortFunc: (a: any, b: any) => any = this.getSortFunction(source);
        return rooms.sort(sortFunc);
    }

    private prioritizeRoomsBySize(rooms: SchedRoom[]): SchedRoom[] {
        let compareFunc = ((a: SchedRoom, b: SchedRoom) => {
            if (a.rooms_seats > b.rooms_seats) {
                return 1;
            }
            if (a.rooms_seats < b.rooms_seats) {
                return -1;
            } else {
                return 0;
            }
        });
        return rooms.sort(compareFunc);
    }

    private getSortFunction(sourceRoom: SchedRoom): (a: any, b: any) => any {
        return ((a: SchedRoom, b: SchedRoom) => {
            if (this.getDistance(sourceRoom, a) > this.getDistance(sourceRoom, b)) {
                return 1;
            }
            if (this.getDistance(sourceRoom, a) < this.getDistance(sourceRoom, b)) {
                return -1;
            } else {
                return 0;
            }
        });
    }

    private prioritizeSections(sections: SchedSection[]): SchedSection[] {
        let compareFunc = ((a: SchedSection, b: SchedSection) => {
            if (this.getSectionSize(a) > this.getSectionSize(b)) {
                return 1;
            }
            if (this.getSectionSize(a) < this.getSectionSize(b)) {
                return -1;
            } else {
                return 0;
            }
        });
        return sections.sort(compareFunc);
    }

    private getMeanLat(rooms: SchedRoom[]): number {
        let res = 0;
        for (let room of rooms) {
            res += room.rooms_lat;
        }
        res = res / rooms.length;
        return res;
    }

    private getMeanLon(rooms: SchedRoom[]): number {
        let res = 0;
        for (let room of rooms) {
            res += room.rooms_lon;
        }
        res = res / rooms.length;
        return res;
    }

    private optimizeDistance(results: Array<[SchedRoom, SchedSection, TimeSlot]>,
                             unusedRooms: SchedRoom[], roomsUsed: SchedRoom[]):
        Array<[SchedRoom, SchedSection, TimeSlot]> {
        let optimizedResult: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
        let centrePseudoRoom: SchedRoom = this.getCentreRoom(roomsUsed);
        let sortedUnusedRooms: SchedRoom[] =
            this.prioritizeRoomsByDistanceFromSource(unusedRooms, centrePseudoRoom).reverse();
        let sortedUsedRooms: SchedRoom[] = this.prioritizeRoomsByDistanceFromSource(roomsUsed, centrePseudoRoom);
        for (let i = 0; i < Math.floor(sortedUsedRooms.length / 2); i++) {
            let usedRoom: SchedRoom = sortedUsedRooms[i];
            let usedRoomkey = usedRoom.rooms_shortname + usedRoom.rooms_number;
            let switchedRooms: Set<string> = new Set<string>();
            roomsLoop: for (let j of unusedRooms) {
                let unusedRoom: SchedRoom = j;
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

    private canRoomsBeSwitched(usedRoomkey: string, unusedRoom: SchedRoom): boolean {
        return this.maxClassInRoom[usedRoomkey] <= unusedRoom.rooms_seats;
    }

    private getCentreRoom(rooms: SchedRoom[]): SchedRoom {
        let meanlat = this.getMeanLat(rooms);
        let meanlon = this.getMeanLon(rooms);
        let result: SchedRoom = {
            rooms_shortname: "_____",  rooms_number: "-1",  rooms_seats: -1, rooms_lat: meanlat, rooms_lon: meanlon
        };
        return result;
    }

    private roomSwitch(usedRoom: SchedRoom, unusedRoom: SchedRoom) {
        let usedRoomKey = usedRoom.rooms_shortname + usedRoom.rooms_number;
        let unusedRoomKey = unusedRoom.rooms_shortname + unusedRoom.rooms_number;
        for (let t = 0; t < 15; t++) {
            this.roomsXtimeXsection[unusedRoomKey][t] = this.roomsXtimeXsection[usedRoomKey][t];
            this.roomsXtimeXsection[usedRoomKey][t] = false;
        }
    }

    private makeTupleFromMatrix(): Array<[SchedRoom, SchedSection, TimeSlot]> {
        let result: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
        let section: SchedSection;
        let room: SchedRoom;
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

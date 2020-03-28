
import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";

export default class Scheduler implements IScheduler {

    private static timeSlots: TimeSlot[] =
        ["MWF 0800-0900" , "MWF 0900-1000" , "MWF 1000-1100" ,
    "MWF 1100-1200" , "MWF 1200-1300" , "MWF 1300-1400" ,
    "MWF 1400-1500" , "MWF 1500-1600" , "MWF 1600-1700" ,
    "TR  0800-0930" , "TR  0930-1100" , "TR  1100-1230" ,
    "TR  1230-1400" , "TR  1400-1530" , "TR  1530-1700"];

    private roomsXtime: any[][];
    private currSection: SchedSection;
    private currRoom: SchedRoom;
    private coursesInTS: Array<Set<string>>;
    private roomsUsed: SchedRoom[];
    private maxClassInRoom: any;
    private roomsXsection: SchedSection[][];

    private initialize(sections: SchedSection[], rooms: SchedRoom[]): void {
        this.coursesInTS = new Array<Set<string>>(15);
        for (let i = 0; i < 15; i++) {
            this.coursesInTS[i] = new Set<string>();
        }
        this.maxClassInRoom = {};
        this.roomsXtime = [];
        this.roomsXsection = [];
        this.roomsUsed = [];
        for (let i = 0; i < rooms.length ; i++) {
            this.roomsXtime[i] = [];
            this.roomsXsection[i] = [];
            for (let j = 0; j < 15; j++) {
                this.roomsXtime[i][j] = false;
                this.roomsXsection[i][j] = null;
            }
        }
    }

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        this.initialize(sections, rooms);
        let orderedRooms = this.prioritizeRoomsBySize(rooms);
        let orderedSections = this.prioritizeSections(sections);
        let result: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
        let filledTimeSlots: number = 0;
        roomsLoop : for (let i = 0; i < orderedRooms.length; i++) {
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

    // returns true if room is not yet booked in given timeslot and no other section is taught in that timeslot
    private timeslotWorks(section: SchedSection, timeslot: number, roomIndex: number): boolean {
        return (!this.coursesInTS[timeslot].has(section.courses_id) && !this.roomsXtime[roomIndex][timeslot]);
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
            if (this.getDistance(sourceRoom, a) < this.getDistance(sourceRoom, b)) {
                return 1;
            }
            if (this.getDistance(sourceRoom, a) > this.getDistance(sourceRoom, b)) {
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
                             unusedRooms: SchedRoom[], roomsused: SchedRoom[]):
        Array<[SchedRoom, SchedSection, TimeSlot]> {
        let optimizedResult: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
        let centrePseudoRoom: SchedRoom = this.getCentreRoom(roomsused);
        let sortedUnusedRooms: SchedRoom[] = this.prioritizeRoomsByDistanceFromSource(unusedRooms, centrePseudoRoom);
        let sortedResult: Array<[SchedRoom, SchedSection, TimeSlot]> =
            this.prioritizeTuplesByDistance(results, centrePseudoRoom);
        let length: number = sortedResult.length;

        return optimizedResult;
    }


    private getCentreRoom(rooms: SchedRoom[]): SchedRoom {
        let meanlat = this.getMeanLat(rooms);
        let meanlon = this.getMeanLon(rooms);
        let result: SchedRoom = {
            rooms_shortname: "_____",  rooms_number: "-1",  rooms_seats: -1, rooms_lat: meanlat, rooms_lon: meanlon
        };
        return result;
    }

    private prioritizeTuplesByDistance(results: Array<[SchedRoom, SchedSection, TimeSlot]>, source: SchedRoom):
        Array<[SchedRoom, SchedSection, TimeSlot]>  {
        let compareFunc = ((a: [SchedRoom, SchedSection, TimeSlot], b: [SchedRoom, SchedSection, TimeSlot]) => {
            if (this.getDistance(source, a[0]) < this.getDistance(source, b[0])) {
                return -1;
            }
            if (this.getDistance(source, a[0]) > this.getDistance(source, b[0])) {
                return 1;
            } else {
                return 0;
            }
        });
        return results.sort(compareFunc);
    }

}

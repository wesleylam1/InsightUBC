
import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";

export default class Scheduler implements IScheduler {

    private static timeSlots: TimeSlot[] =
        ["MWF 0800-0900" , "MWF 0900-1000" , "MWF 1000-1100" ,
    "MWF 1100-1200" , "MWF 1200-1300" , "MWF 1300-1400" ,
    "MWF 1400-1500" , "MWF 1500-1600" , "MWF 1600-1700" ,
    "TR  0800-0930" , "TR  0930-1100" , "TR  1100-1230" ,
    "TR  1230-1400" , "TR  1400-1530" , "TR  1530-1700"];

    private roomsXtime: any;
    private courseXtime: any;
    private currSection: SchedSection;
    private currRoom: SchedRoom;
    private currTime: TimeSlot;
    private alreadyScheduledSections: any = {};

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        let orderedRooms = this.prioritizeRooms(rooms);
        let orderedSections = this.prioritizeSections(sections);
        this.roomsXtime = {};
        this.courseXtime = {};
        this.alreadyScheduledSections = {};
        let loopDone: boolean = false;
        let result: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
        for (let room of orderedRooms) {
            let name: string = room.rooms_shortname + room.rooms_number;
            loopDone = false;
            this.roomsXtime[name] = new Set<TimeSlot>();
            while (!loopDone ) {
                for (let i in orderedSections) {
                    let section: SchedSection = orderedSections[i];
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

    private canSchedule(room: SchedRoom, section: SchedSection): boolean {
        return (this.doesSectionFitInRoom(section, room) && this.checkCourseTimes(section));
    }

    private checkCourseTimes(section: SchedSection): boolean {
        if (this.courseXtime.hasOwnProperty(section.courses_id)) {
            for (let time of Scheduler.timeSlots) {
                if (!this.courseXtime[section.courses_id].has(time)) {
                    this.currTime = time;
                    this.courseXtime[section.courses_id].add(time);
                    return true;
                }
            }
            return false;
        } else {
            this.courseXtime[section.courses_id] = new Set<TimeSlot>() ;
            this.courseXtime[section.courses_id].add(Scheduler.timeSlots[0]);
            return true;
        }

    }


    private doesSectionFitInRoom(section: SchedSection, room: SchedRoom): boolean {
        let size: number = this.getSectionSize(section);
        return size <= room.rooms_seats;
    }

    private getSectionSize(section: SchedSection) {
        return section.courses_audit + section.courses_fail + section.courses_pass;
    }

    private getDistance(sourceRoom: SchedRoom, destRoom: SchedRoom) {
        let lat1 = sourceRoom.rooms_lat;
        let lat2 = destRoom.rooms_lat;
        let lon1 = sourceRoom.rooms_lon;
        let lon2 = destRoom.rooms_lon;
        let R = 6371000; // Radius of the earth in km
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

    private prioritizeRooms(rooms: SchedRoom[]): SchedRoom[] {
        let source: SchedRoom = rooms[0];
        let sortFunc: (a: any, b: any) => any = this.getSortFunction(source);
        return rooms.sort(sortFunc);
    }

    private getSortFunction(sourceRoom: SchedRoom): (a: any, b: any) => any {
        return ((a: SchedRoom, b: SchedRoom) => {
            if (this.getDistance(sourceRoom, a) < this.getDistance(sourceRoom, b)) {
                return -1;
            }
            if (this.getDistance(sourceRoom, a) > this.getDistance(sourceRoom, b)) {
                return 1;
            } else {
                return 0;
            }
        });
    }

    private prioritizeSections(sections: SchedSection[]): SchedSection[] {
        let compareFunc = ((a: SchedSection, b: SchedSection) => {
            if (this.getSectionSize(a) > this.getSectionSize(b)) {
                return -1;
            }
            if (this.getSectionSize(a) < this.getSectionSize(b)) {
                return 1;
            } else {
                return 0;
            }
        });
        return sections.sort(compareFunc);
    }
}

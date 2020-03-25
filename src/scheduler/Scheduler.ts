import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
import Log from "../Util";

export default class Scheduler implements IScheduler {

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        // TODO Implement this
        const result: Array<[SchedRoom, SchedSection, TimeSlot]> = new Array<[SchedRoom, SchedSection, TimeSlot]>();
        sections.sort((a: SchedSection, b: SchedSection) => {
            return (a.courses_audit + a.courses_fail + a.courses_pass) -
                (b.courses_audit + b.courses_pass + b.courses_fail);
        });
        sections.reverse();
        let midPoint: number[] = findMidpoint(rooms);
        findDistanceFromMidPoint(rooms, midPoint);
        rooms.sort((a: SchedRoom, b: SchedRoom) => {
            return a.rooms_seats - b.rooms_seats;
        });
        const times: TimeSlot[] = ["MWF 0800-0900", "MWF 0900-1000", "MWF 1000-1100", "MWF 1100-1200", "MWF 1200-1300",
            "MWF 1300-1400", "MWF 1400-1500", "MWF 1500-1600", "MWF 1600-1700", "TR  0800-0930", "TR  0930-1100",
            "TR  1100-1230", "TR  1230-1400", "TR  1400-1530", "TR  1530-1700"];
        const scheduledCourses: SchedSection[] = [];
        for (let time of times) {
            const scheduledSections: string[] = [];
            const scheduledRooms: SchedRoom[] = [];
            for (let section of sections) {
                const viableRooms: SchedRoom[] = [];
                if (!scheduledSections.includes(section.courses_dept + section.courses_id)
                    && !scheduledCourses.includes(section)) {
                    for (let room of rooms) {
                        if (checkRoom(scheduledRooms, section, room)) {
                            viableRooms.push(room);
                        }
                    }
                    if (viableRooms.length === 0) {
                        continue;
                    }
                    let closestRoom: SchedRoom = viableRooms.reduce((min: SchedRoom, room: SchedRoom) =>
                        min.rooms_distance < room.rooms_distance ? min : room);
                    result.push([closestRoom, section, time]);
                    scheduledSections.push(section.courses_dept + section.courses_id);
                    scheduledCourses.push(section);
                    scheduledRooms.push(closestRoom);
                }
            }
        }
        return result;
    }
}

// Original code from C3 spec https://www.movable-type.co.uk/scripts/latlong.html
export function findDistance(room: SchedRoom, midPoint: number[]) {
    let R = 6371e3; // metres
    let φ1 = toRadians(room.rooms_lat);
    let φ2 = toRadians(midPoint[0]);
    let Δφ = toRadians(midPoint[0] - room.rooms_lat);
    let Δλ = toRadians(midPoint[1] - room.rooms_lon);

    function toRadians(degree: number) {
        let pi = Math.PI;
        return degree * (pi / 100);
    }
    let a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

export function findMidpoint(rooms: SchedRoom[]): number[] {
    let sumLat: number = 0;
    let sumLon: number = 0;
    let n: number = rooms.length;
    for (let room of rooms) {
        sumLat += room.rooms_lat;
        sumLon += room.rooms_lon;
    }
    return [(sumLat / n), (sumLon / n)];
}

export function findDistanceFromMidPoint(rooms: SchedRoom[], midPoint: number[]) {
    for (let room of rooms) {
        room.rooms_distance = findDistance(room, midPoint);
    }
}

export function checkRoom(schedRooms: SchedRoom[], section: SchedSection, room: SchedRoom): boolean {
    let a = !schedRooms.includes(room);
    let b = (section.courses_pass + section.courses_fail + section.courses_audit) <= room.rooms_seats;
    return a && b ;
}



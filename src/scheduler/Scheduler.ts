import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
import Log from "../Util";

export default class Scheduler implements IScheduler {
    private static times: TimeSlot[] = ["MWF 0800-0900", "MWF 0900-1000", "MWF 1000-1100", "MWF 1100-1200",
        "MWF 1200-1300", "MWF 1300-1400", "MWF 1400-1500", "MWF 1500-1600", "MWF 1600-1700", "TR  0800-0930",
        "TR  0930-1100", "TR  1100-1230", "TR  1230-1400", "TR  1400-1530", "TR  1530-1700"];

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        // TODO Implement this
        const result: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
        let sortedSections = this.sortSections(sections);
        let midPoint: number[] = findMidpoint(rooms);
        let distancedRooms = this.distanceRooms(rooms, midPoint);
        const scheduledCourses: SchedSection[] = [];

        for (let time of Scheduler.times) {
            const scheduledSections: string[] = [];
            const scheduledRooms: Array<[SchedRoom, number]> = [];
            for (let section of sortedSections) {
                const viableRooms: Array<[SchedRoom, number]> = [];
                if (checkSection(scheduledSections, section, scheduledCourses)) {
                    for (let distanceRoom of distancedRooms) {
                        if (checkRoom(scheduledRooms, section, distanceRoom)) {
                            viableRooms.push(distanceRoom);
                        }
                    }
                    if (viableRooms.length === 0) {
                        continue;
                    }
                    let room: [SchedRoom, number] = viableRooms.reduce((min: [SchedRoom, number],
                                                                        rm: [SchedRoom, number]) =>
                        (min[0].rooms_seats * 0.7) + (min[1] * 0.3) <
                        (rm[0].rooms_seats * 0.7) + (rm[1] * 0.3) ? min : rm);
                    result.push([room[0], section, time]);
                    scheduledSections.push(section.courses_dept + section.courses_id);
                    scheduledCourses.push(section);
                    scheduledRooms.push(room);
                }
            }
        }
        return result;
    }

    private sortRooms(rooms: SchedRoom[]): SchedRoom[] {
        return rooms.sort((a: SchedRoom, b: SchedRoom) => {
            return a.rooms_seats - b.rooms_seats;
        });
    }

    private sortSections(sections: SchedSection[]): SchedSection[] {
        return sections.sort((a: SchedSection, b: SchedSection) => {
            return (b.courses_audit + b.courses_fail + b.courses_pass) -
                (a.courses_audit + a.courses_pass + a.courses_fail);
        });
    }

    private distanceRooms(rooms: SchedRoom[], midPoint: number[]): Array<[SchedRoom, number]> {
        let i: number = 0;
        let distanced: Array<[SchedRoom, number]> = [];
        rooms.sort((a: SchedRoom, b: SchedRoom) => {
            return findDistance(a, midPoint) - findDistance(b, midPoint);
        });
        for (let room of rooms) {
            distanced.push([room, i]);
            i++;
        }
        return distanced;
    }
}

// Original code from C3 spec https://www.movable-type.co.uk/scripts/latlong.html
function findDistance(room: SchedRoom, midPoint: number[]) {
    let R = 6371e3; // metres
    let lat1 = toRadians(room.rooms_lat);
    let lat2 = toRadians(midPoint[0]);
    let lon1 = toRadians(midPoint[0] - room.rooms_lat);
    let lon2 = toRadians(midPoint[1] - room.rooms_lon);

    function toRadians(degree: number) {
        return degree * (Math.PI / 100);
    }

    let a =
        Math.sin(lon1 / 2) * Math.sin(lon1 / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(lon2 / 2) * Math.sin(lon2 / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function findMidpoint(rooms: SchedRoom[]): number[] {
    let sumLat: number = 0;
    let sumLon: number = 0;
    let n: number = rooms.length;
    for (let room of rooms) {
        sumLat += room.rooms_lat;
        sumLon += room.rooms_lon;
    }
    return [(sumLat / n), (sumLon / n)];
}

function checkRoom(schedRooms: Array<[SchedRoom, number]>, section: SchedSection, room: [SchedRoom, number]): boolean {
    let a = !schedRooms.includes(room);
    let b = (section.courses_pass + section.courses_fail + section.courses_audit) <= room[0].rooms_seats;
    return a && b ;
}

function checkSection(scheduledSections: string[], section: SchedSection, scheduledCourses: SchedSection[]) {
    return !scheduledSections.includes(section.courses_dept + section.courses_id)
        && !scheduledCourses.includes(section);
}

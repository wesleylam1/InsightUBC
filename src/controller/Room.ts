import {InsightError} from "./IInsightFacade";

export class Room {
    public fullName: string;
    public shortName: string;
    public number: string;
    public address: string;
    public lat: number;
    public lon: number;
    public seats: number;
    public type: string;
    public furniture: string;
    public href: string;

    constructor() {
        this.fullName = null;
        this.shortName = null;
        this.number = null;
        this.address = null;
        this.lat = null;
        this.lon = null;
        this.seats = null;
        this.type = null;
        this.furniture = null;
        this.href = null;
    }
}

interface GeoResponse {
    lat?: number;
    lon?: number;
    error?: string;
}

export function makeRoom(parsedRoom: any, node: any, geoLocation: any): Room {
    let room: Room = new Room();
    try {
        room.shortName = node.childNodes[3].childNodes[0].value.trim();
        room.fullName = node.childNodes[5].childNodes[1].childNodes[0].value.trim();
        room.number = parsedRoom.childNodes[1].childNodes[1].childNodes[0].value;
        room.address = node.childNodes[7].childNodes[0].value.trim();
        room.lat = geoLocation.lat;
        room.lon = geoLocation.lon;
        room.seats = Number(parsedRoom.childNodes[3].childNodes[0].value.trim());
        room.type = parsedRoom.childNodes[7].childNodes[0].value.trim();
        room.furniture = parsedRoom.childNodes[5].childNodes[0].value.trim();
        room.href = parsedRoom.childNodes[9].childNodes[1].attrs[0].value;
    } catch (error) {
        throw new InsightError(error);
    }
    return room;
}



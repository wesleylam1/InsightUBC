import {makeRoom, Room} from "./Room";
import * as parse5 from "parse5";
import * as JSZip from "jszip";
import {InsightError} from "./IInsightFacade";

export function parseIndex(files: any[], content: string): Promise<Room[]> {
    return new Promise((resolve, reject) => {
        let roomArray: Array<Promise<any>> = [];
        let parsedIndex = parse5.parse(files[0]);
        let index = findIndex(parsedIndex, "tbody");
        for (let row of index.childNodes) {
            if (row.nodeName === "tr") {
                let geoAddress = row.childNodes[7].childNodes[0].value;
                roomArray.push(parseBuilding(row, content, geoAddress));
            }
        }
        Promise.all(roomArray)
            .then((array: any[]) => {
                let rooms = [].concat.apply([], array);
                if (rooms.length !== 0) {
                    resolve(rooms);
                } else {
                    reject(new InsightError("No rooms found"));
                }
            });
    });
}

function findIndex(parsedIndex: any, tag: string): any {
    if (!parsedIndex || parsedIndex.childNodes === undefined) {
        return null;
    } else if (parsedIndex.nodeName === tag) {
        return parsedIndex;
    }
    for (let parsedFragment of parsedIndex.childNodes) {
        let node = findIndex(parsedFragment, tag);
        if (node !== null) {
            return node;
        }
    }
    return null;
}

function parseBuilding(node: any, content: string, geoAddress: string): Promise<Room[]> {
    let rooms: Room[] = [];
    let href = node.childNodes[9].childNodes[1].attrs[0].value;
    let buildingName = href.substring(2);
    return new Promise((resolve, reject) => {
        let a = JSZip.loadAsync(content, {base64: true});
        let roomIndex = a.then((zip: JSZip) => {
            return zip.files["rooms/" + buildingName].async("text");
            })
            .then((buildingData: string) => {
                return parse5.parse(buildingData);
            })
            .then((parsedBuilding: any) => {
                return findIndex(parsedBuilding, "tbody");
            });
        let geoLocation = getGeoLocation(geoAddress);
        Promise.all([roomIndex , geoLocation])
            .then(([resultB, resultC]) => {
                if (resultB !== null) {
                    for (let room of resultB.childNodes) {
                        if (room.nodeName === "tr") {
                            let rm: Room = makeRoom(room, node, resultC);
                            rooms.push(rm);
                        }
                    }
                }
            })
            .then(() => {
                resolve(rooms);
            })
            .catch((err) => {
                reject(new InsightError(err));
            });
    });
}

function getGeoLocation(geoAddress: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const http = require("http");
        let url = makeURL(geoAddress.trim());
        http.get("http://cs310.students.cs.ubc.ca:11316/api/v1/project_team133/" + url, (resp: any) => {
            resp.setEncoding("utf8");
            let data = "";
            resp.on("data", (chunk: any) => {
                data += chunk;
            });
            resp.on("end", () => {
                let geoLocation = JSON.parse(data);
                if (geoLocation.hasOwnProperty("lat") && geoLocation.hasOwnProperty("lon")) {
                    resolve(geoLocation);
                } else {
                    reject(new InsightError("Location fetching failed"));
                }
            });
        }).on("error", (err: Error) => {
            reject(new InsightError(err));
        });
    });
}

function makeURL(address: string): string {
    return address.split(" ").join("%20");
}

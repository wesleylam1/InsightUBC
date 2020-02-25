import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import {CourseDataset, Dataset, RoomDataset} from "./Dataset";
import Log from "../Util";
import {Course, readCourseData} from "./Course";
import * as JSZip from "jszip";
import * as fs from "fs";
import {parseIndex} from "./RoomParser";
import {Room} from "./Room";
import {JSZipObject} from "jszip";

export default class DatasetController {
    private datasetsAdded: Map<string, Dataset> = new Map<string, Dataset>();
    private directory: string = "./data";

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.readFromDisk();
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let self = this;
        return new Promise((resolve, reject) => {
            try {
                self.checkDuplicates(id, self.datasetsAdded);
                self.verifyAddDataset(id, content, kind);
                self.initiateDataset(id, content, kind)
                    .then((dataset: Dataset) => {
                        self.addToDisk(id, dataset);
                        self.datasetsAdded.set(id, dataset);
                        let ids = Array.from(self.datasetsAdded.keys());
                        resolve(ids);
                    })
                    .catch((err) => {
                        reject(err);
                    });
            } catch (err) {
                reject(err);
            }
        });
    }

    public getDatasetCourses(id: string): any {
        if (this.datasetsAdded.has(id) ) {
            return this.datasetsAdded.get(id).data;
        } else {
            throw new InsightError("A dataset with this id could not be found");
        }
    }

    public getDatasetKind(id: string): any {
        if (this.datasetsAdded.has(id) ) {
            return this.datasetsAdded.get(id).datatype;
        } else {
            throw new InsightError("A dataset with this id could not be found");
        }
    }

    private addCourses(id: string, content: string): Promise<CourseDataset> {
        return new Promise((resolve, reject) => {
            let courses: Course[] = [];
            JSZip.loadAsync(content, {base64: true})
                .then((zip: JSZip) => {
                    let promisesList: Array<Promise<any>> = new Array<Promise<any>>();
                    if (!("courses/" in zip.files)) {
                        throw new InsightError();
                    }
                    zip.forEach((relativePath: string, file: JSZipObject) => {
                        promisesList.push(file.async("text"));
                    });
                    Promise.all(promisesList)
                        .then((files: any) => {
                            courses = readCourseData(files);
                            if (courses.length === 0) {
                                reject(new InsightError("No courses found"));
                            }
                            let dataset: CourseDataset = new CourseDataset(id, InsightDatasetKind.Courses, courses);
                            resolve(dataset);
                        }).catch(function (error) {
                        reject(new InsightError(error));
                    });
                })
                .catch(() => {
                    reject(new InsightError("Incorrect files (not courses) in zip"));
                });
        });
    }

    private addRooms(id: string, content: string): Promise<RoomDataset> {
        return new Promise((resolve, reject) => {
            let promisesList: Array<Promise<any>> = new Array<Promise<any>>();
            JSZip.loadAsync(content, {base64: true})
                .then((zip: JSZip) => {
                    if (!("rooms/" in zip.files)) {
                        throw new InsightError("No rooms folder found");
                    }
                    promisesList.push(zip.folder("rooms").file("index.htm").async("text"));
                    Promise.all(promisesList)
                        .then((files: any[]) => {
                        return parseIndex(files, content);
                        })
                        .then((result: Room[]) => {
                            if (result.length === 0) {
                                reject(new InsightError("No rooms found"));
                            }
                            let dataset: RoomDataset = new RoomDataset(id, InsightDatasetKind.Rooms, result);
                            resolve(dataset);
                        })
                        .catch((err) => {
                            reject(new InsightError(err));
                        });
                    }).catch((error) => {
                reject(new InsightError(error));
            });
        });
    }

    private addToDisk(id: string, dataset: Dataset) {
        let data: string = JSON.stringify(dataset);
        let path: string = this.directory.concat("/" + id);

        if (!fs.existsSync(this.directory)) {
            fs.mkdirSync(this.directory);
        }

        try {
            fs.writeFileSync(path, data);
        } catch {
            throw new InsightError("Saving to disk failed");
        }
    }

    private initiateDataset(id: string, content: string, kind: InsightDatasetKind): Promise<Dataset> {
        if (kind === InsightDatasetKind.Courses) {
            return this.addCourses(id, content);
        } else if (kind === InsightDatasetKind.Rooms) {
            return this.addRooms(id, content);
        } else {
            throw (new InsightError("Invalid datatype"));
        }
    }


    private verifyAddDataset(id: string, content: string, kind: InsightDatasetKind) {
        if (!id || id.includes("_") || id.trim() === "" || id === "") {
            throw new InsightError("Invalid ID");
        }
        if (!content || content === "") {
            throw new InsightError("Invalid content");
        }
        if (kind !== InsightDatasetKind.Courses && kind !== InsightDatasetKind.Rooms) {
            throw new InsightError("Invalid dataset type");
        }
    }

    private checkDuplicates(id: string, map: Map<string, Dataset>) {
        if (map.has(id)) {
            throw new InsightError("Duplicate ID");
        }
    }

    public readFromDisk() {
        if (fs.existsSync(this.directory)) {
            let files = fs.readdirSync(this.directory);
            if (files.length !== 0) {
                for (let file of files) {
                    let path = this.directory.concat("/" + file);
                    let data = fs.readFileSync(path);
                    let parsedData = JSON.parse(data.toString());
                    let id: string = parsedData["id"];
                    let datatype: InsightDatasetKind = parsedData["datatype"];
                    if (datatype === InsightDatasetKind.Courses) {
                        let courses: Course[] = parsedData["data"];
                        let dataset = new CourseDataset(id, datatype, courses);
                        this.datasetsAdded.set(id, dataset);
                    } else if (datatype === InsightDatasetKind.Rooms) {
                        let rooms: Room[] = parsedData["data"];
                        let dataset = new RoomDataset(id, datatype, rooms);
                        this.datasetsAdded.set(id, dataset);
                    } else {
                        throw new InsightError("Failed to load datasets from disk");
                    }
                }
            }
        }
    }

    public removeDataset(id: string): Promise<string> {
        if (!id || id.includes("_") || id.trim() === "") {
            return Promise.reject(new InsightError("Invalid ID"));
        }
        if (!this.datasetsAdded.has(id)) {
            return Promise.reject(new NotFoundError("No such dataset added"));
        }
        if (!fs.existsSync(this.directory.concat("/" + id))) {
            return Promise.reject(new InsightError("No such dataset found on disk"));
        }
        try {
            this.datasetsAdded.delete(id);
            fs.unlinkSync(this.directory.concat("/" + id));
            return Promise.resolve(id);
        } catch {
            return Promise.reject(new InsightError());
        }
    }

    public listDatasets(): Promise<InsightDataset[]> {
        let result: InsightDataset[] = [];
        this.datasetsAdded.forEach((value: Dataset) => {
            result.push(value.generateInsightDataset());
        });
        return Promise.resolve(result);
    }

}

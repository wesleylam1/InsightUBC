import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import {Dataset} from "./Dataset";
import Log from "../Util";
import {Course, readCourseData} from "./Course";
import * as JSZip from "jszip";
import * as fs from "fs";


export default class DatasetController {
    private datasetsAdded: Map<string, Dataset>;
    private directory: string = "./data";

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.datasetsAdded = new Map<string, Dataset>();
        this.readFromDisk();
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let self = this;
        return new Promise(function (resolve, reject) {
            try {
                self.checkDuplicates(id, self.datasetsAdded);
                self.verifyAddDataset(id, content, kind);
                self.initiateDataset(id, content, kind)
                    .then(function (dataset: Dataset) {
                        self.addToDisk(id, dataset);
                        self.datasetsAdded.set(id, dataset);
                        let ids = Array.from(self.datasetsAdded.keys());
                        resolve(ids);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            } catch (err) {
                reject(err);
            }
        });
    }

    public getDatasetCourses(id: string): any {
        if (this.datasetsAdded.has(id) ) {
            return this.datasetsAdded.get(id).courses;
        } else {
            throw new InsightError("A dataset with this id could not be found");
        }
    }

    private addCourses(id: string, content: string): Promise<Dataset> {
        return new Promise(function (resolve, reject) {
            let courses: Course[] = [];
            JSZip.loadAsync(content, {base64: true})
                .then((zip: JSZip) => {
                    let promisesList: Array<Promise<any>> = new Array<Promise<any>>();

                    if (!("courses/" in zip.files)) {
                        throw new InsightError();
                    }
                    zip.forEach(function (relativePath, file) {
                        promisesList.push(file.async("text"));
                    });

                    Promise.all(promisesList)
                        .then(function (files: any) {
                            courses = readCourseData(files);
                            let dataset: Dataset = new Dataset(id, InsightDatasetKind.Courses, courses);
                            resolve(dataset);
                        }).catch(function (error) {
                        reject(new InsightError(error));
                    });
                })
                .catch(function (err) {
                    reject(new InsightError("Incorrect files (not courses) in zip"));
                });
        });
    }

    private addRooms(id: string, content: string): Promise<Dataset> {
        return new Promise(function (resolve, reject) {
            JSZip.loadAsync(content, {base64: true})
                .then((zip: JSZip) => {
                    if (!("rooms/" in zip.files)) {
                        throw new InsightError();
                    }
                })
                .catch((err) => {
                    reject(new InsightError("Incorrect files ( not rooms) in zip"));
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
            return Promise.reject(new InsightError("Rooms not valid"));
            // return this.addRooms(id, content);
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
                    let courses: Course[] = parsedData["courses"];
                    let dataset = new Dataset(id, datatype, courses);
                    this.datasetsAdded.set(id, dataset);
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

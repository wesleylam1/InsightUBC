"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("./IInsightFacade");
const Dataset_1 = require("./Dataset");
const Util_1 = require("../Util");
const Course_1 = require("./Course");
const JSZip = require("jszip");
const fs = require("fs");
class DatasetController {
    constructor() {
        this.directory = "./data";
        Util_1.default.trace("InsightFacadeImpl::init()");
        this.datasetsAdded = new Map();
        this.readFromDisk();
    }
    addDataset(id, content, kind) {
        let self = this;
        return new Promise(function (resolve, reject) {
            try {
                self.checkDuplicates(id, self.datasetsAdded);
                self.verifyAddDataset(id, content, kind);
                self.initiateDataset(id, content, kind)
                    .then(function (dataset) {
                    self.addToDisk(id, dataset);
                    self.datasetsAdded.set(id, dataset);
                    let ids = Array.from(self.datasetsAdded.keys());
                    resolve(ids);
                })
                    .catch(function (err) {
                    reject(err);
                });
            }
            catch (err) {
                reject(err);
            }
        });
    }
    getDatasetCourses(id) {
        return this.datasetsAdded.get(id).courses;
    }
    addCourses(id, content) {
        return new Promise(function (resolve, reject) {
            let courses = [];
            JSZip.loadAsync(content, { base64: true })
                .then((zip) => {
                let promisesList = new Array();
                if (!("courses/" in zip.files)) {
                    throw new IInsightFacade_1.InsightError();
                }
                zip.forEach(function (relativePath, file) {
                    promisesList.push(file.async("text"));
                });
                Promise.all(promisesList)
                    .then(function (files) {
                    courses = Course_1.readCourseData(files);
                    let dataset = new Dataset_1.Dataset(id, IInsightFacade_1.InsightDatasetKind.Courses, courses);
                    resolve(dataset);
                }).catch(function (error) {
                    reject(new IInsightFacade_1.InsightError(error));
                });
            })
                .catch(function (err) {
                reject(new IInsightFacade_1.InsightError("Incorrect files (not courses) in zip"));
            });
        });
    }
    addRooms(id, content) {
        return new Promise(function (resolve, reject) {
            JSZip.loadAsync(content, { base64: true })
                .then((zip) => {
                if (!("rooms/" in zip.files)) {
                    throw new IInsightFacade_1.InsightError();
                }
            })
                .catch(function (error) {
                reject(new IInsightFacade_1.InsightError("Incorrect files ( not rooms) in zip"));
            });
        });
    }
    addToDisk(id, dataset) {
        let data = JSON.stringify(dataset);
        let path = this.directory.concat("/" + id);
        if (!fs.existsSync(this.directory)) {
            fs.mkdirSync(this.directory);
        }
        try {
            fs.writeFileSync(path, data);
        }
        catch (_a) {
            throw new IInsightFacade_1.InsightError("Saving to disk failed");
        }
    }
    initiateDataset(id, content, kind) {
        if (kind === IInsightFacade_1.InsightDatasetKind.Courses) {
            return this.addCourses(id, content);
        }
        else if (kind === IInsightFacade_1.InsightDatasetKind.Rooms) {
            return Promise.reject(new IInsightFacade_1.InsightError("Rooms not valid"));
        }
        else {
            throw (new IInsightFacade_1.InsightError("Invalid datatype"));
        }
    }
    verifyAddDataset(id, content, kind) {
        if (!id || id.includes("_") || id.trim() === "" || id === "") {
            throw new IInsightFacade_1.InsightError("Invalid ID");
        }
        if (!content || content === "") {
            throw new IInsightFacade_1.InsightError("Invalid content");
        }
        if (kind !== IInsightFacade_1.InsightDatasetKind.Courses && kind !== IInsightFacade_1.InsightDatasetKind.Rooms) {
            throw new IInsightFacade_1.InsightError("Invalid dataset type");
        }
    }
    checkDuplicates(id, map) {
        if (map.has(id)) {
            throw new IInsightFacade_1.InsightError("Duplicate ID");
        }
    }
    readFromDisk() {
        if (fs.existsSync(this.directory)) {
            let files = fs.readdirSync(this.directory);
            if (files.length !== 0) {
                for (let file of files) {
                    let path = this.directory.concat("/" + file);
                    let data = fs.readFileSync(path);
                    let parsedData = JSON.parse(data.toString());
                    let id = parsedData["id"];
                    let datatype = parsedData["datatype"];
                    let courses = parsedData["courses"];
                    let dataset = new Dataset_1.Dataset(id, datatype, courses);
                    this.datasetsAdded.set(id, dataset);
                }
            }
        }
    }
    removeDataset(id) {
        if (!id || id.includes("_") || id.trim() === "") {
            return Promise.reject(new IInsightFacade_1.InsightError("Invalid ID"));
        }
        if (!this.datasetsAdded.has(id)) {
            return Promise.reject(new IInsightFacade_1.NotFoundError("No such dataset added"));
        }
        if (!fs.existsSync(this.directory.concat("/" + id))) {
            return Promise.reject(new IInsightFacade_1.InsightError("No such dataset found on disk"));
        }
        try {
            this.datasetsAdded.delete(id);
            fs.unlinkSync(this.directory.concat("/" + id));
            return Promise.resolve(id);
        }
        catch (_a) {
            return Promise.reject(new IInsightFacade_1.InsightError());
        }
    }
    listDatasets() {
        let result = [];
        this.datasetsAdded.forEach((value) => {
            result.push(value.generateInsightDataset());
        });
        return Promise.resolve(result);
    }
}
exports.default = DatasetController;
//# sourceMappingURL=DatasetController.js.map
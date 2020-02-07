import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import {DatasetSection} from "./DatasetSection";
import Log from "../Util";
import * as JSZip from "jszip";
import {JSZipObject} from "jszip";
import * as fs from "fs";
import parse5 = require("parse5");


interface InsightDatasets {
    [id: string]: DatasetWrapper;
}

interface DatasetWrapper {
    content: {};
    MetaData: InsightDataset;
}


export class InsightDatasetProcessor {

    private datasets: InsightDatasets = {};

    private currentKind: InsightDatasetKind;
    private currentNumRows: number;


    constructor() {
        Log.trace("initializing DatasetProcessor");
        this.loadDatasetsFromDisk();
    }

    private loadDatasetsFromDisk(): void {
        Log.trace("Loading Datasets from disk...");
        fs.readdirSync("./data").forEach((file) => {
            this.loadFileToMemory(file);
        });
        Log.trace("Loaded Datasets from disk");
    }

    private loadFileToMemory(file: string) {
        let loadedFile: any = fs.readFileSync("./data/" + file);
        let fileJSON: DatasetWrapper = JSON.parse(loadedFile);
        this.datasets[fileJSON.MetaData.id] = fileJSON;
    }
    public setCurrentKind(kind: InsightDatasetKind): void {
        this.currentKind = kind;
    }

    private setCurrentNumrows(numRows: number): void {
        this.currentNumRows = numRows;
    }


    private saveToDisk(id: string, saveData: any): Promise<any> {

        return new Promise((resolve, reject) => {
            Log.trace("Saving to disk...");
            let IsDs: InsightDataset = {
                id: id,
                kind: this.currentKind,

                numRows: this.currentNumRows,
            };
            let dsWrapper: DatasetWrapper = {
                content: saveData,
                MetaData: IsDs,
            };
            this.datasets[id] = dsWrapper;
            try {
                fs.writeFile(
                    "./data/" + id + ".json",
                    JSON.stringify(this.datasets[id]),
                    () => {
                        Log.trace("Successfully saved to disk");
                        resolve();
                    },
                );
            } catch (err) {
                reject(
                    new InsightError(
                        "Something went wrong with saving to disk",
                    ),
                );
            }
        });
    }


    public removeDataset(id: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            return this.validateID(id)
                .then((result: string) => {
                    return this.findAndDeleteDataset(id).then((res2) => {
                        return this.deleteFromDisk(id).then(() => {
                            resolve(id);
                        });
                    });
                })
                .catch((err: any) => {
                    return reject(err);
                });

        });
    }

    private deleteFromDisk(id: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            Log.trace("Trying to delete dataset from disk...");
            try {
                fs.unlinkSync("./data/" + id + ".json");
                Log.trace("Dataset removed from disk");
                resolve(id);
            } catch (err) {

                reject(
                    new InsightError(
                        "something went wrong with file deletion from disk",
                    ),
                );
            }
        });
    }

    private findAndDeleteDataset(id: string): Promise<string> {
        return new Promise((resolve, reject) => {
            let found: boolean = false;
            for (let key in this.datasets) {
                let indexedDataset: DatasetWrapper = this.datasets[key];
                if (indexedDataset.MetaData.id === id) {
                    found = true;
                    delete this.datasets[key];
                }
            }
            if (!found) {

                return reject(
                    new NotFoundError(
                        "The id you tried to delete did not exist",
                    ),
                );
            }
            return resolve(id);
        });
    }


    public validateID(id: string): Promise<string> {
        return new Promise((resolve, reject) => {
            let allWhiteSpace: boolean = true;
            for (let i = 0; i < id.length; i++) {
                if (id.charAt(i) === "_") {
                    //     Log.trace("first if, about to reject");

                    return reject(
                        new InsightError("dataset id contained an underscore"),
                    );
                }
                if (allWhiteSpace && !(id.charAt(i) === " ")) {
                    allWhiteSpace = false;
                }
            }
            if (allWhiteSpace) {
                //    Log.trace("reject");
                throw reject(new InsightError("dataset id all whitespace"));
            }
            //     Log.trace("about to return id");
            return resolve(id);
        });
    }

    public readZip(id: string, content: string): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            for (let key in this.datasets) {
                let indexedDataset: DatasetWrapper = this.datasets[key];
                if (indexedDataset.MetaData.id === id) {
                return reject(new InsightError("id already taken"));
                }
            }
            let outerThis = this;
            let myZip = new JSZip();
            let coursePromises: Array<Promise<string>> = new Array<Promise<string>>();
            let result: any;
            myZip.loadAsync(content, { base64: true }).then((zip: JSZip) => {
                let atLeastOneFile: boolean = false;
                for (let f of Object.keys(zip.folder("courses").files)) {
                        if (zip.file(f) == null) {
                            continue;
                        } else {
                            atLeastOneFile = true;
                            //             Log.trace(f);
                            coursePromises.push(zip.file(f).async("text"));
                        }
                    }
                if (!atLeastOneFile) {
                        return reject(new InsightError("no files in zip folder"));
                    }
                Promise.all(coursePromises).then((parsableFiles: any) => {
                        //        Log.trace("all promises done");
                        result = outerThis.parse(parsableFiles);
                        outerThis
                            .saveToDisk(id, result)
                            .then((res: any) => {
                                let datasetList: string[] = [];
                                for (let savedID in this.datasets) {
                                    datasetList.push(savedID);
                                }
                                //            Log.trace("About to resolve readZip");
                                resolve(datasetList);
                            })
                            .catch((err: Error) => {
                                reject(new InsightError("something wrong in save"));
                            });
                    });
                })
                .catch((err: Error) => {
                    Log.trace(err);
                    return reject(new InsightError("something wrong in readzip"));
                });
        });
    }

    private parse(content: string): DatasetSection[] {

        let sections: any[] = [];
        //    Log.trace("begining parse");
        let validSections: number = 0;
        for (let course of content) {
            //   Log.trace("Beginning parse for loop");
            try {
                let currCourse: any = JSON.parse(course);
                let parsedResult: any = currCourse["result"];
                let currentSection: string;
                let resultSection: DatasetSection;
                for (let section of parsedResult) {
                    currentSection = section;

                    try {
                        resultSection = this.parseSection(currentSection);
                        validSections++;
                        sections.push(resultSection);
                    } catch (Error) {
                        continue;
                    }
                }
            } catch (Errror) {
                continue;
            }
        }
        this.setCurrentNumrows(validSections);
        if (validSections === 0) {
            throw new InsightError("no valid sections");
        }
        //   Log.trace("returning sections");
        return sections;
    }

    private parseSection(section: any): DatasetSection {
        //     Log.trace("making section");
        let secYear: number;
        let secID: string;
        if (section["Section"] === "overall") {
            secYear = 1900;
        } else {
            secYear = parseInt(section["Year"], 10);
        }
        secID = section["id"].toString();
        return new DatasetSection(
            section["Subject"],
            section["Course"],
            section["Avg"],
            section["Professor"],
            section["Title"],
            section["Pass"],
            section["Fail"],
            section["Audit"],
            secID,
            secYear,
        );
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return new Promise<InsightDataset[]>((resolve) => {

            Log.trace("Building list...");
            let resultArray: InsightDataset[] = [];
            for (let key in this.datasets) {
                let indexedDataset: DatasetWrapper = this.datasets[key];
                resultArray.push(indexedDataset.MetaData);
            }
            Log.trace("Dataset list built:");
            Log.trace(resultArray);
            resolve(resultArray);
        });
    }
    // this comment is just so I can commit again
}

import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import {DatasetSection} from "./DatasetSection";
import Log from "../Util";
import * as JSZip from "jszip";
import {JSZipObject} from "jszip";
import * as fs from "fs-extra";
import parse5 = require("parse5");


interface InsightDatasets {
    [id: string]: {};
}


export class InsightDatasetProcessor {
    private path: string = __dirname + "/data";
    private datasets: InsightDataset;

    constructor() {
        Log.trace("initializing Processor");
    }


    public validateID(id: string): Promise<string> {
        return new Promise((resolve, reject) => {
            let allWhiteSpace: boolean = true;
            for (let i = 0; i < id.length; i++) {
                if (id.charAt(i) === "_") {
                    //     Log.trace("first if, about to reject");
                    return reject(new InsightError("dataset id contained an underscore"));
                }
                if (allWhiteSpace && !(id.charAt(i) === " ")) {
                    allWhiteSpace = false;
                }
            }
            if (allWhiteSpace) {
                //    Log.trace("reject");
                throw reject(new InsightError("dataset id all whitespace"));
            }
            Log.trace("about to return id");
            return resolve(id);
        });
    }

    public readZip(id: string, content: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            let outerThis = this;
            let myZip = new JSZip();

            let coursePromises: Array<Promise<string>> = new Array<Promise<string>>();
            let result: any;
            myZip.loadAsync(content, {base64: true}).then((zip: JSZip) => {
                Log.trace("in readzip after loadAsync");

                if (zip.folder("courses").length === 0) {
                    return reject(new InsightError("no courses folder"));
                }
                for (let f of Object.keys(zip.folder("courses").files)) {
                    if (zip.file(f) == null) {
                        continue;
                    } else {
                        Log.trace(f);
                        coursePromises.push(zip.file(f).async("text"));
                    }
                }
                Promise.all(coursePromises).then((parsableFiles: any) => {
                    Log.trace("all promises done");
                    result = outerThis.parse(parsableFiles);
                    outerThis.saveToDisk(id, result).then((res: number) => {
                        Log.trace("About to resolve readZip");
                        resolve(true);
                    });
                });
            }).catch((err: Error) => {
                reject(err);
            });
        });
    }


    private saveToDisk(id: any, result: {}): Promise<number> {
        return new Promise((resolve) => {
            Log.trace("saveToDisk");
            return (2);
        });
    }

    private parse(content: string): any[] {
        let sections: any[] = [];
        for (let course of content) {
            let currCourse: any = JSON.parse(course);
            let parsedResult: any = currCourse["result"];
            let currentSection: DatasetSection;
            for (let section in parsedResult) {
                    currentSection = this.parseSection(section);
                    sections.push(currentSection);
            }
            return sections;
        }
    }

    private parseSection(section: any): DatasetSection {
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
            section["Instructor"],
            section["Title"],
            section["Pass"],
            section["Fail"],
            section["Audit"],
            secID,
            secYear);
    }

}

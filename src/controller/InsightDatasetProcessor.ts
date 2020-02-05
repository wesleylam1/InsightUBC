import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import {IndividualDataSet} from "./IndividualDataSet";
import Log from "../Util";
import * as JSZip from "jszip";
import {JSZipObject} from "jszip";


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
            let result = {};
            myZip.loadAsync(content, {base64: true}).then((zip: JSZip) => {
                Log.trace("in readzip after loadAsync");
                for (let f of Object.keys(zip.folder("courses").files)) {
                    if (zip.file(f) == null) {
                        continue;
                    } else {
                        Log.trace(f);
                        coursePromises.push(zip.file(f).async("text"));
                    }
                }
                Promise.all(coursePromises).then((content1: any) => {
                    Log.trace("all promises done");
                    result = outerThis.parse(content1);
                    outerThis.saveToDisk(id, result);
                    resolve(true);
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

    private parse(content: any): {} {
        Log.trace("parsing triggered");
        return {};
    }
}

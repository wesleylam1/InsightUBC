import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, ResultTooLargeError} from "./IInsightFacade";
import performQueryHelper from "./performQueryHelper";
import {InsightError, NotFoundError} from "./IInsightFacade";
import * as JSZip from "jszip";
import {InsightDatasetProcessor} from "./InsightDatasetProcessor";
import {JSZipObject} from "jszip";
import * as fs from "fs";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    public processor = new InsightDatasetProcessor();

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.processor = new InsightDatasetProcessor();
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
            let processor = this.processor;
            return new Promise((resolve, reject) => {
                if (id) {
                    if (kind === InsightDatasetKind.Rooms) {
                        return reject(new InsightError("Rooms kind is invalid"));
                    }
                    this.processor.setCurrentKind(kind);
                    processor.validateID(id).then((result) => {
                        processor.readZip(result, content).then((finalResult: string[]) => {
                            // Log.trace("then");
                            return resolve(finalResult);

                        }).catch((err: any) => {
                            return reject(err);
                        });
                    }).catch((err: any) => {
                        return reject(err);
                    });
                } else {
                    return reject(new InsightError("id was null or undefined"));
                }
            });
    }

    public removeDataset(id: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (id) {
                return this.processor.removeDataset(id).then((result: string) => {
                    return resolve(result);
                }).catch((err: any) => {
                    return reject(err);
                });
        } else {
                return reject(new InsightError("id was null or undefined"));
            }
        });
    }

    public performQuery(query: any): Promise<any[]> {
            try {
                let isEmpty = performQueryHelper.isEmpty(query);
                if (!isEmpty) {
                    return performQueryHelper.validQuery(query).then(function (result: any) {
                        return Promise.resolve(result);
                    });
                } else {
                    return Promise.reject("Invalid Query");
                }

            } catch (err) {
                if (err === "NotFoundError") {
                    return Promise.reject(new NotFoundError("Query Not Found"));
                } else if (err === "ResultTooLargeError") {
                    return Promise.reject(new ResultTooLargeError("Over 5000 results"));
                } else {
                    return Promise.reject(new InsightError("Insight Error Found"));
                }
        }   return Promise.reject(new InsightError("Insight Error"));
     }

    public listDatasets(): Promise<InsightDataset[]> {
        return new Promise((resolve, reject) => {
            return this.processor.listDatasets().then((result: InsightDataset[]) => {
               return resolve(result);
           }).catch((err: any) => {
               return reject(err);
           });
        });
    }

}

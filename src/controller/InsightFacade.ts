import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
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
    private static processor = new InsightDatasetProcessor();

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
            let processor = InsightFacade.processor;
            return new Promise((resolve, reject) => {
                if (kind === InsightDatasetKind.Rooms) {
                    return reject(new InsightError("Rooms kind is invalid"));
                }
                processor.validateID(id).then((result) => {
                    processor.readZip(result, content);
                    Log.trace("then");
                    let result2 = new Array<string>();
                    resolve(result2);
                }).catch((err: Error) => {
                    return err;
                });
        });
    }


    public removeDataset(id: string): Promise<string> {
        return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise<any[]> {
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.reject("Not implemented.");
    }
}

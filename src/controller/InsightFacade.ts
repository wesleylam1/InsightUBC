import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";
import * as JSZip from "jszip";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    private datasets: InsightDataset[];

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.datasets = new Array();
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return new Promise((resolve, err) => {
            Log.trace("Starting Promise");
            let zip = new JSZip();
            return this.checkDatasetIDValidity(id).then((result) => {
                Log.trace("Done check ID Validity");
                if (result) {
                    return this.checkAndLoadZip(content, zip).then((result2: string) => {
                        return Promise.resolve();
                    });
                }
        }).catch((error: Error) => {
            return Promise.reject(error);
            });
        });
    }

    private checkAndLoadZip(content: string, zip: JSZip): Promise<string> {
        return Promise.resolve("placeholder");
    }


    private checkDatasetIDValidity(id: string): Promise<boolean> {
        return new Promise((resolve) => {
         //   Log.trace("Starting checkIDValidity");
            let allWhiteSpace: boolean = true;
            for (let i = 0; i < id.length; i++) {
           if (id.charAt(i) === "_") {
          //     Log.trace("first if, about to reject");
               return Promise.reject(new InsightError("dataset id contained an underscore"));
           }
           if (allWhiteSpace && !(id.charAt(i) === " ")) {
               allWhiteSpace = false;
           }
        }
            if (allWhiteSpace) {
            //    Log.trace("reject");
                return Promise.reject(new InsightError("dataset id all whitespace"));
        }
            for (let i of this.datasets) {
            let takenID = i.id;
            if (id === takenID) {
            //    Log.trace("ID taken, time to reject");
                return Promise.reject(new InsightError("dataset id already taken"));
            }
        }
          //  Log.trace("about to return true");
            return Promise.resolve(true);
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

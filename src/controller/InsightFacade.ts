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
            Log.trace("Starting Promise");
            return this.checkDatasetIDValidity(id).then((result) => {
                Log.trace("Done check ID Validity");
                let jszip: JSZip = new JSZip();
                Log.trace("Made JSZip");
                return JSZip.loadAsync(content).then((result2) => {
                        let confirmationId: string[];
                        return confirmationId;
                    });
        }).catch((error: any) => {
            return (error);
            });
    }

   // private checkAndLoadZip(result: boolean, content: string): Promise<JSZip> {
    //    Log.trace("starting check and Load Zip");
   //     let JSZip jszip = new JSZip();
   //     JSZip.loadAsync(content)


   // }


    private checkDatasetIDValidity(id: string): Promise<boolean> {

        Log.trace("Starting checkIDValidity");
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
        Log.trace("about to return true");
        return Promise.resolve(true);
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

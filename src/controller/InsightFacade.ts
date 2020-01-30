import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";

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
        return Promise.reject("Not implemented.");
    }

    private checkDatasetIDValidity(id: string): Promise<boolean> {
        let allWhiteSpace: boolean = true;
        for (let i = 0; i < id.length; i++) {
           if (id.charAt(i) === "_") {
               return Promise.reject(new InsightError("dataset id contained an underscore"));
           }
           if (!(id.charAt(i) === " ") && allWhiteSpace) {
               allWhiteSpace = false;
           }
        }
        if (allWhiteSpace) {
            return Promise.reject(new InsightError("dataset id all whitespace"));
        }
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

import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, ResultTooLargeError} from "./IInsightFacade";
import performQueryHelper from "./performQueryHelper";
import {InsightError, NotFoundError} from "./IInsightFacade";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return Promise.reject("Not implemented.");
    }

    public removeDataset(id: string): Promise<string> {
        return Promise.reject("Not implemented.");
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
        return Promise.reject("Not implemented.");
    }
}

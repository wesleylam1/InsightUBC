import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, ResultTooLargeError} from "./IInsightFacade";
import performQueryHelper from "./performQueryHelper";
import {InsightError, NotFoundError} from "./IInsightFacade";
import {getColumnValues, ICourseData, searchWithFilter} from "./help";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
interface Queries {
    WHERE?: Filters;
    OPTIONS?: {
        COLUMNS?: string[];
        ORDER?: string;
    };
}
export interface Filters {
    AND?: Filters[];
    OR?: Filters[];
    NOT?: Filters;
    mField?: string;
    mValue?: number;
    sField?: string;
    sValue?: string;
}

class CourseDatabase {
    public courseObjectList?: ICourseHash;
    public datasetIDList?: string[];

    constructor() {
        this.courseObjectList = {};
        this.datasetIDList = [];
    }
}

interface ICourseHash {
    [key: string]: ICourseData[];
}
const mField = new Set (["avg", "pass", "audit", "fail", "year"]);
const sField = new Set (["dept", "id", "instructor", "title", "uuid"]);
export default class InsightFacade implements IInsightFacade {
    private database: CourseDatabase;

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
                    return performQueryHelper.validQuery(query).then((result: Queries) => {
                        let courseArr: ICourseData[] = searchWithFilter(result.WHERE, "none", this.database);
                        if (courseArr.length > 5000) {
                            return Promise.reject("ResultTooLarge");
                        }
                        let returnArr: any[] = [];
                        for (let c of courseArr) {
                            let obj: {[k: string]: any} = {};
                            for (let col of result.OPTIONS.COLUMNS) {
                                getColumnValues(col, obj, c);
                            }
                            returnArr.push(obj);
                            return Promise.resolve(returnArr);
                        }
                        let ord = result.OPTIONS.ORDER;
                        if (mField.has(ord.split("_")[1])) {
                            returnArr.sort((a, b) => {
                                return parseFloat(a[ord]) - parseFloat(b[ord]);
                            });
                        } else if (sField.has(ord.split("_")[1])) {
                            returnArr.sort((a, b) => {
                                return (a[ord]).localeCompare(b[ord]);
                            });
                        }
                    })
                 .catch ((err: any) => {
                if (err === "NotFoundError") {
                    return Promise.reject(new NotFoundError("Query Not Found"));
                } else if (err === "ResultTooLargeError") {
                    return Promise.reject(new ResultTooLargeError("Over 5000 results"));
                } else {
                    return Promise.reject(new InsightError("Insight Error Found"));
                }});
     }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.reject("Not implemented.");
    }
}

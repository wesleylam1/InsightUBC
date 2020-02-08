import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";
import {ICourseData} from "./help";


export interface Queries {
    WHERE?: {};
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

export interface CourseData {
    dept: string;
    id: string;
    avg: number;
    instructor: string;
    title: string;
    pass: number;
    fail: number;
    audit: number;
    uuid: string;
    year: number;

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
const Comparator = new Set (["LT", "GT", "EQ", "IS"]);
const ComparatorALL = new Set (["LT", "GT", "EQ", "IS", "AND", "OR", "NOT"]);
const qSet = new Set(["WHERE", "OPTIONS"]);
const TSet = new Set(["WHERE", "OPTIONS"]);

export default class PerformQueryHelper {

    public static isEmpty(query: any): boolean {
        if (this.emptyQuery(query)) {
            return false;
        }
    }
    public static validQuery(query: any): Promise<Queries> {
        let whereOptions = Object.keys(query);
        if ((whereOptions.length) === 2) {
            for (let i = 0; i < 2; i++) {
                if (!(qSet.has(whereOptions[i]))) {
                    return Promise.reject("Not provided BODY/OPTIONS");
                }
            }
        } else if ((whereOptions.length) === 3) {
            for (let i = 0; i < 3; i++) {
                if (!(TSet.has(whereOptions[i]))) {
                    return Promise.reject("Not provided BODY/OPTIONS/TRANSFORMATIONS");
                }
            }
        } else {
            return Promise.reject("More than Body and Options/Transformation");
        }
        let queryFill: Queries = {};
        try {
            let queryBody = this.WhereFilter(query["WHERE"]);
            let queryOptions = this.OptionsFilter(query["OPTIONS"]);
            queryFill.WHERE = queryBody;
            queryFill.OPTIONS = { COLUMNS: [] };
            if (!(queryOptions[queryOptions.length - 1] === "")) {
                queryFill.OPTIONS.ORDER = queryOptions.pop();
            }
            queryFill.OPTIONS.COLUMNS = queryOptions;
            return Promise.resolve(queryFill);
        } catch (e) {
            if (e.message === "ResultTooLarge") {
                return Promise.reject("ResultTooLarge");
            }
            return Promise.reject("Failed to create query");
        }
    }


    public static emptyQuery(query: Queries): boolean {
        if (query.OPTIONS.COLUMNS === []) {
            return true;
        }
        if (query.OPTIONS.ORDER === "") {
            return true;
        }
        if (query.WHERE === {}) {
            return true;
        } else {
            return false;
        }

    }

    public static CourseData(query: any): Filters {
        let Filter = Object.keys(query)[0];
        let FilterValue = Object.values(query)[0];
        let key = Filter.substring((Filter.indexOf("_") + 1), (Filter.length));
        let result: Filters = {};
        if (!sField.has(Filter[0]) || !mField.has(Filter[0])) {
            throw new InsightError("invalid key");
        }
        if (sField && !(typeof FilterValue === "string") || mField && !(typeof FilterValue === "number")) {
            throw new InsightError("values do not match keys");
        }
        if (query === "LT" || query === "GT" || query === "EQ") {
            result.mField = key;
            result.mValue = FilterValue as number;
        }
        if (query === "IS") {
            result.sField = key;
            result.sValue = FilterValue as string;

        }
        return result;

    }

    public static WhereFilter(query: any): Filters {
        let Filter = Object.keys(query);
        if (Filter.length > 1) {
            throw new InsightError("more than 1 filter");
        }
        if (Filter.length === 1) {
            if (!(ComparatorALL.has(Filter[0]))) {
                throw new InsightError("Not a valid Filter");
            } else if (Comparator.has(Filter[0])) {
                return PerformQueryHelper.CourseData(Filter[0]);
            } else if (Filter[0] === "NOT") {
                return PerformQueryHelper.NOTFilter(Filter[0]);
            } else { return PerformQueryHelper.AndOrFilter(Filter[0]); }
        }
    }


    public static NOTFilter(query: any): Filters {
        let Filter = Object.keys(query);
        let result = null;
        if (Filter.length > 1) {
            throw new InsightError("more than 1 filter");
        }
        if (Filter.length === 1) {
            if (!(ComparatorALL.has(Filter[0]))) {
                throw new InsightError("Not a valid Filter");
            } else if (Comparator.has(Filter[0])) {
                result = PerformQueryHelper.CourseData(Filter[0]);
            } else if (Filter[0] === "NOT") {
                result =  PerformQueryHelper.NOTFilter(Filter[0]);
            } else { result = PerformQueryHelper.AndOrFilter(Filter[0]); }
        }
        let results: Filters;
        results.NOT = result;
        return results;
    }

    public static AndOrFilter(query: any): Filters {
        let Filter = Object.keys(query);
        let result: Filters = {};
        let element: Filters = {};
        if (Filter.length > 1) {
            throw new InsightError("more than 1 filter");
        }
        if (Filter.length === 1) {
            if (!(ComparatorALL.has(Filter[0]))) {
                throw new InsightError("Not a valid Filter");
            } else if (Comparator.has(Filter[0])) {
                element =  this.CourseData(Filter[0]);
            } else if (Filter[0] === "NOT") {
                element = this.NOTFilter(Filter[0]);
            } else { element = this.AndOrFilter(Filter[0]); }
        }
        if (query === "AND") {
            result.AND.push(element);
        } else { result.OR.push(element); }
        return result;

    }

    public static OptionsFilter (query: any): string[] {
        let Filter = Object.keys(query);
        let FilterValue = Object.values(query);
        let resultArray: string[];
        let resultOrder = "";
        if (Filter.length > 2 || Filter.length === 0) {
            throw new InsightError("invalid Options Filter");
        }
        if (Filter.length === 2) {
            for (let element of Filter) {
                if (element === "COLUMNS") {
                    resultArray = this.columnsFilter(query["COLUMNS"]);
                } else if (element === "ORDER") {
                    resultOrder = this.orderFilter(query["ORDER"], query["COLUMNS"]);
                }  else { throw new InsightError("invalid Options Filter"); }
            }
        }
        resultArray.push(resultOrder);
        return resultArray;

    }

    public static orderFilter (order: any, columns: any): string {
        if (columns.includes(order)) {
            return order;
        } else { throw new InsightError("Order not in Columns"); }
    }

    public static columnsFilter (query: any[]): string[] {
        let database: CourseDatabase;
        let queryID = "";
        let tempArray: string[] = [];
        if (!Array.isArray(query) || query.length === 0) {
            throw new InsightError("Columns must contain a non-empty string array");
        } else {
            for (let value of query) {
                if (typeof value === "string") {
                    let innerID = value.substring(0, value.indexOf("_"));
                    let innerKey = value.substring((value.indexOf("_") + 1), (value.length));
                    if (!(database.datasetIDList.includes(innerID))) {
                        throw new InsightError("query ID not found in dataset");
                    }
                    if (!((mField.has(innerKey)) || (sField.has(innerKey)))) {
                        throw new InsightError("Invalid query key");
                    }
                    if (queryID === "") {
                        queryID = innerID;
                    } else if (queryID !== innerID) {
                        throw new InsightError("Mismatching query IDs");
                    }
                    tempArray.push(value);
                } else {
                    throw new InsightError("Invalid type of Column Key");
                }
            }
            return tempArray;
        }}
}

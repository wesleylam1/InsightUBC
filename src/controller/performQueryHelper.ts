import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";


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
const mField = new Set (["courses_avg", "courses_pass", "courses_audit", "courses_fail", "courses_year"]);
const sField = new Set (["courses_dept", "courses_id", "courses_instructor", "courses_title", "courses_uuid"]);
const Comparator = new Set (["LT", "GT", "EQ", "IS"]);
const ComparatorALL = new Set (["LT", "GT", "EQ", "IS", "AND", "OR", "NOT"]);

export default class PerformQueryHelper {

    public static isEmpty(query: any): boolean {
        if (this.emptyQuery(query)) {
            return false;
        }
    }

    public static validQuery(query: any): Promise<any> {
        let result: Queries = {};
        try {
            let queryWhere = this.WhereFilter(query["WHERE"]);
            let queryOptions = this.OptionsFilter(query["OPTIONS"]);
            result.WHERE = queryWhere;
            result.OPTIONS.COLUMNS = queryOptions;
            return Promise.resolve(result);
        } catch (e) {
            if (e.message === "ResultTooLarge") {
                return Promise.reject("ResultTooLarge");
            }
            return Promise.reject("Invalid Query");

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
        let resultArray: string[];
        if (!Array.isArray(query) || query.length === 0) {
            throw new InsightError("Invalid Column");
        }
        for (let element of query) {
            resultArray.push(element);
        }
        return resultArray;

    }
}

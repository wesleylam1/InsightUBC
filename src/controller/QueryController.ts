import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ResultTooLargeError
} from "./IInsightFacade";
import {checkDuplicates, verifyAddDataset} from "./AddDatasetHelper";
import * as JSZip from "jszip";
import {Course, readCourseData} from "./Course";
import {Dataset} from "./Dataset";
import * as fs from "fs";
import AddDatasetController from "./AddDatasetController";
import DatasetController from "./DatasetController";


import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";


export interface Queries {
    WHERE?: Filters;
    OPTIONS: {
        COLUMNS: string[];
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


const mField = new Set (["avg", "pass", "audit", "fail", "year"]);
const sField = new Set (["dept", "id", "instructor", "title", "uuid"]);
const Comparator = new Set (["LT", "GT", "EQ", "IS"]);
const ComparatorALL = new Set (["LT", "GT", "EQ", "IS", "AND", "OR", "NOT"]);

export default class QueryController {
    private datasetController: DatasetController;
    private currentDatasetID: string;
    private sections: any;

    public setDatasetController(controller: DatasetController) {
        this.datasetController = controller;

    }

    public performQuery(query: any): Promise<any[]> {
        try {
            let isEmpty = this.isEmpty(query);
            if (!isEmpty) {
                return this.validQuery(query).then(function (result: any) {
                    return this.doQuery(query);
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

    private processQuery(query: Queries): any {
        try {
            Log.trace("reached doQuery");
            let comparator: any = Object.keys(query)[0];

            if (comparator === "GT" || comparator === "LT" || comparator === "EQ") {
                return this.processMathComparator(query, comparator);
            }
            if (comparator === "IS") {
                return this.processStringComparator(query, comparator);
            }
            if (comparator === "NOT" || comparator === "AND" || comparator === "OR") {
                return this.processLogicComparator(query, comparator);
            }
        } catch (err) {
            return err;
        }
    }

    private processStringComparator(query: any, comparator: string) {
        let key: any = Object.keys(query)[0];
        if (!this.getKeyandCheckIDValid(key)) {
            throw new InsightError("Multiple Datasets not supported");
        }
        if (!sField.has(key)) {
            throw new InsightError("used String Comparator with non sField");
        }
        let value: any = query[key];
        if (!(typeof value !== "string")) {
            throw new InsightError("invalid value");
        }
        let result: any[] = [];
        if(value)
        for (let section of this.sections) {
            if(this.compareString(key, value, comparator, section)) {
                result.push(section);
            }
        }
        return result;
    }

    private compareString(key: string, value: string, comparator: string, section: any) {
        let sectionData = section[key];
        let valueRegex: RegExp = this.getRegex(value);
        if (comparator === "IS") {

        }
    }

   // private getRegex(value: string): RegExp {
    //    let length: number = value.length;
     //   if()
   // }

    private processLogicComparator(query: any, comparator: string): any[] {
        if (comparator === "OR") {
            return this.processOR(query["OR"], comparator);
        }
        if (comparator === "AND") {
            return this.processAND(query["AND"], comparator);
        }
        if (comparator === "NOT") {
            return this.processNOT(query["NOT"], comparator);
        }
    }

    private processAND(query: any, comparator: string): any[] {
        let result = [];
        if (query === [] ) {
            throw new InsightError("AND must have at least 1 filter");
        }
        for (let filter in query) {
            result.push(this.processQuery(filter));
        }
        if (result.length > 1) {
            result = this.getSharedResults(result);
            return result;
        } else {
            return result[0];
        }
    }

    private getSharedResults(array: [[]]): any {
        let result: any = [];
        result = new Array<any[]>();
        result.push(array[0]);
        for (let i = 0; i < array.length; i++) {
            result = result.filter((x) => (array[i].includes(x)));
        }
        return result;
    }

    private processNOT(query: any, comparator: string): any[] {
        let NOTResult: any = [];
        if (query === [] ) {
            throw new InsightError("Not must have at least 1 filter");
        }
        if (Object.keys.length > 1) {
            throw new InsightError("Not cannot have more than 1 filter");
        }
        NOTResult = this.processQuery(query);
        return(this.excludeSections(NOTResult));
    }

    private excludeSections(itemsToExclude: any[]): any {
        let result: any = [];
        result = new Array<any>();
        result = this.sections.filter((x) => !itemsToExclude.includes(x));
        return result;
        }


    private processOR(query: any, comparator: string): any[] {
        let result: any[] = [];
        if (query === [] ) {
            throw new InsightError("OR must have at least 1 filter");
        }
        for (let filter in query) {
            result.push(this.processQuery(filter));
        }
        if (result.length > 1) {
            result = this.mergeResults(result);
            return result;
        } else {
            return result[0];
        }
    }

    private mergeResults(array: any[]): any {
        let result: any = [];
        result = new Array<any[]>();
        result.push(array[0]);
        for (let i = 1; i < array.length; i++) {
            result.concat(array[i]);
        }
        return result;
    }


    private processMathComparator(query: any, comparator: string): any {
        let key: any = Object.keys(query)[0];
        if (!this.getKeyandCheckIDValid(key)) {
            throw new InsightError("Multiple Datasets not supported");
        }
        if (!mField.has(key)) {
            throw new InsightError("used Math Comparator with non mField");
        }
        let value: any = query[key];
        if (!(typeof value !== "number")) {
            throw new InsightError("invalid value");
        }
        let result: any[] = [];
        for (let section of this.sections) {
            if (this.compareMath(key, value, comparator, section)) {
                if (result.length === 5000) {
                    throw new ResultTooLargeError("ResultTooLarge");
                }
                result.push(section);
            }
        }
        return result;
    }

    private compareMath(key: any, value: number, comparator: string, section: any): boolean {
        let sectionData: number = section[key];
        if (comparator === "GT") {
            return sectionData > value;
        }
        if (comparator === "LT") {
            return sectionData < value;
        }
        if (comparator === "EQ") {
            return sectionData === value;
        }
    }

    // returns true if query is empty
    public isEmpty(query: any): boolean {
        if (this.emptyQuery(query)) {
            return false;
        }
    }

    // checks that Query has WHERE and  OPTIONS with COLUMNS
    public validQuery(query: any): Promise<any> {
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
            // return Promise.reject("Invalid Querys");

        }
    }

    // returns true if query is empty, false if not
    public  emptyQuery(query: Queries): boolean {
        if (query.OPTIONS.COLUMNS === []) {
            return true;
        }
        if (query.OPTIONS.ORDER === "") {
            return true;
        }
        if (query.WHERE === []) {
            return true;
        } else {
            return false;
        }
    }

    public CourseData(query: any): Filters {
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

    public  WhereFilter(query: any): Filters {
        let Filter = Object.keys(query);
        if (Filter.length > 1) {
            throw new InsightError("more than 1 filter");
        }
        if (Filter.length === 1) {
            if (!(ComparatorALL.has(Filter[0]))) {
                throw new InsightError("Not a valid Filter");
            } else if (Comparator.has(Filter[0])) {
                return this.CourseData(Filter[0]);
            } else if (Filter[0] === "NOT") {
                return this.NOTFilter(Filter[0]);
            } else { return this.AndOrFilter(Filter[0]); }
        }
    }


    public  NOTFilter(query: any): Filters {
        let Filter = Object.keys(query);
        let result = null;
        if (Filter.length > 1) {
            throw new InsightError("more than 1 filter");
        }
        if (Filter.length === 1) {
            if (!(ComparatorALL.has(Filter[0]))) {
                throw new InsightError("Not a valid Filter");
            } else if (Comparator.has(Filter[0])) {
                result = QueryController.CourseData(Filter[0]);
            } else if (Filter[0] === "NOT") {
                result =  QueryController.NOTFilter(Filter[0]);
            } else { result = QueryController.AndOrFilter(Filter[0]); }
        }
        let results: Filters;
        results.NOT = result;
        return results;
    }

    public AndOrFilter(query: any): Filters {
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

    public OptionsFilter (query: any): string[] {
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

    public orderFilter (order: any, columns: any): string {
        if (columns.includes(order)) {
            return order;
        } else { throw new InsightError("Order not in Columns"); }
    }

    public columnsFilter (query: any[]): string[] {
        let resultArray: string[];
        if (!Array.isArray(query) || query.length === 0) {
            throw new InsightError("Invalid Column");
        }
        for (let element of query) {
            resultArray.push(element);
        }
        return resultArray;

    }

    private getKeyandCheckIDValid(id: string): string {
        let idstring: string = id.split("_", 1)[0];
        if (idstring !== this.currentDatasetID) {
            throw new InsightError("Multiple Datasets not supported");
        }
        return idstring;
    }


}

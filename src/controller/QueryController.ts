import {InsightError, NotFoundError, ResultTooLargeError} from "./IInsightFacade";
import DatasetController from "./DatasetController";
import Log from "../Util";
import OptionsHelper from "./OptionsHelper";
import ObjectArrayHelper from "./ObjectArrayHelper";

const mField = new Set(["avg", "pass", "audit", "fail", "year"]);
const sField = new Set(["dept", "id", "instructor", "title", "uuid"]);
const Comparator = new Set(["LT", "GT", "EQ", "IS"]);
const ComparatorALL = new Set(["LT", "GT", "EQ", "IS", "AND", "OR", "NOT"]);

export default class QueryController {
    private datasetController: DatasetController;
    private currentDatasetID: string;
    private sections: any;
    private optionsHelper: OptionsHelper;
    private objectArrayHelper: ObjectArrayHelper;

    public initialize(controller: DatasetController) {
        this.datasetController = controller;
        this.currentDatasetID = null;
        this.sections = null;
        this.optionsHelper = new OptionsHelper();
        this.optionsHelper.setController(this);
        this.objectArrayHelper = new ObjectArrayHelper();
    }

    public performQuery(query: any): Promise<any[]> {
        try {
            this.validQuery(query);
            Log.trace("finished validQuery");
            let result: any[] = this.processFilter(query["WHERE"]);
            Log.trace("About to start columns and order");
            result = this.optionsHelper.doColumnsAndOrder(query, result);
            Log.trace("checking result length");
            if (result) {
            if (result.length > 5000) {
                throw new ResultTooLargeError("Result exceeded 5000 entries");
            }
        }
            return Promise.resolve(result);
        } catch (err) {
            return Promise.reject(err);
        }
    }

    private processFilter(query: any): any {
        try {
            if (query === {}) {
                return;
            }
            Log.trace("reached doQuery");
            let comparator: any = Object.keys(query)[0];
            if (comparator === "GT" || comparator === "LT" || comparator === "EQ") {
                return this.processMathComparator(query[comparator], comparator);
            }
            if (comparator === "IS") {
                return this.processStringComparator(query[comparator], comparator);
            }
            if (comparator === "NOT" || comparator === "AND" || comparator === "OR") {
                return this.processLogicComparator(query, comparator);
            } else {
                throw new InsightError("WHERE can only have filters");
            }
        } catch (err) {
            throw err;
        }
    }

    private processStringComparator(query: any, comparator: string): any {
        let key: string = Object.keys(query)[0];
        if (!this.getKeyandCheckIDValid(key)) {
            throw new InsightError("Multiple Datasets not supported");
        }
        if (!sField.has(key.split("_")[1])) {
            throw new InsightError("used String Comparator with non sField");
        }
        let value: any = query[key];
        if (typeof value !== "string") {
            throw new InsightError("invalid value");
        }
        let result: any[] = [];
        let compareFunc: (str: string) => boolean = this.makeIsBoolean(value);
        for (let section of this.sections) {
            if (this.compareString(key.split("_")[1], value, comparator, section, compareFunc)) {
                result.push(section);
            }
        }
        Log.trace("About to return string comparator");
        return result;
    }

    private compareString(key: string, value: string, comparator: string, section: any,
                          compareFunc: (str: string) => boolean): boolean {
        let sectionData: string = section[key];
        if (comparator === "IS") {
            return compareFunc(sectionData);
        }
    }

    private makeIsBoolean(val: string): (str: string) => boolean {
        let input: string;
        if (val.startsWith("*") && !val.endsWith("*")) {
            input = this.getValidInputString(val.split("*")[1]);
            return (str: string) => { return str.endsWith(input); };
        }
        if (val.startsWith("*") && val.endsWith("*")) {
            input = this.getValidInputString(val.substring(1, (val.length - 1)));
            return (str: string) => { return str.includes(input); };
        }
        if (!val.startsWith("*") && val.endsWith("*")) {
            input = this.getValidInputString(val.substring(0, (val.length - 1)));
            return (str: string) => { return str.startsWith(input); };
        } else {
            input = this.getValidInputString(val);
            return (str: string) => { return str === input; };
        }
    }

    private getValidInputString(val: string): string {
        if (val.includes("*")) {
            throw new InsightError("Asterisks can only be beginning or end of input string");
        }
        return val;
    }

    private processLogicComparator(query: any, comparator: string): any[] {
        if (comparator === "OR") { return this.processOR(query["OR"]); }
        if (comparator === "AND") { return this.processAND(query["AND"]); }
        if (comparator === "NOT") { return this.processNOT(query["NOT"]); }
    }

    private processAND(query: any[]): any {
        let result = [];
        if (!Array.isArray(query)) {
            throw new InsightError("AND must have at least 1 filter");
        }
        for (let filter of query) {
            result.push(this.processFilter(filter));
        }
        result = this.objectArrayHelper.getSharedResults(result);
        return result;
        }

    private processNOT(query: any): any[] {
        let NOTResult: any = [];
        if (query === []) {
            throw new InsightError("Not must have at least 1 filter");
        }
        if (Object.keys(query)[0] === "NOT") {
            return this.processFilter(query["NOT"]);
        }
        if (Object.keys.length > 1) {
            throw new InsightError("Not cannot have more than 1 filter");
        }
        NOTResult = this.processFilter(query);
        return (this.objectArrayHelper.excludeSections(NOTResult, this.sections));
    }

    private processOR(query: any[]): any[] {
        let result: any[] = [];
        let mergedResults: any[] = [];
        if (query === []) {
            throw new InsightError("OR must have at least 1 filter");
        }
        for (let filter of query) {
            result.push(this.processFilter(filter));
        }
        for (let array of result) {
            mergedResults = this.objectArrayHelper.mergeResults(mergedResults, array);
            }
        return mergedResults;
        }

    private processMathComparator(query: any, comparator: string): any {
        let key: string = Object.keys(query)[0];
        if (!this.getKeyandCheckIDValid(key)) {
            throw new InsightError("Multiple Datasets not supported");
        }
        if (!mField.has(key.split("_")[1])) {
            throw new InsightError("used Math Comparator with non mField");
        }
        let value: any = query[key];
        if (typeof value !== "number") {
            throw new InsightError("invalid value");
        }
        let result: any[] = [];
        for (let section of this.sections) {
            if (this.compareMath(key.split("_")[1], value, comparator, section)) {

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

    // checks that Query has WHERE and  OPTIONS with COLUMNS
    public validQuery(query: any): boolean {
        if (!(query.hasOwnProperty("WHERE"))) {
            throw new InsightError("Query missing WHERE section");
        }
        if (!(query.hasOwnProperty("OPTIONS"))) {
            throw new InsightError("Query missing OPTIONS section");
        }
        if (!(query["OPTIONS"].hasOwnProperty("COLUMNS"))) {
            throw new InsightError("OPTIONS missing COLUMNS");
        }
        return true;
    }

    public getKeyandCheckIDValid(key: string): string {
        let idstring: string = key;
        idstring = idstring.split("_", 1)[0];
        if (this.currentDatasetID == null) {
            this.currentDatasetID = idstring;
        }
        if (idstring !== this.currentDatasetID) {
            throw new InsightError("Multiple Datasets not supported");
        }
        try {
            if (this.sections == null) {
                this.sections = this.datasetController.getDatasetCourses(idstring);
            }
        } catch (err) {
            throw err;
        }
        return idstring;
    }
}

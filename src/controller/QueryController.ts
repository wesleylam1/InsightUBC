import {InsightError, NotFoundError, ResultTooLargeError} from "./IInsightFacade";
import DatasetController from "./DatasetController";
import Log from "../Util";
import OptionsHelper from "./OptionsHelper";

const mField = new Set(["avg", "pass", "audit", "fail", "year"]);
const sField = new Set(["dept", "id", "instructor", "title", "uuid"]);
const Comparator = new Set(["LT", "GT", "EQ", "IS"]);
const ComparatorALL = new Set(["LT", "GT", "EQ", "IS", "AND", "OR", "NOT"]);

export default class QueryController {
    private datasetController: DatasetController;
    private currentDatasetID: string;
    private sections: any;
    private optionsHelper: OptionsHelper;

    public setDatasetController(controller: DatasetController) {
        this.datasetController = controller;
        this.currentDatasetID = null;
        this.sections = null;
        this.optionsHelper = new OptionsHelper();
    }

    public performQuery(query: any): Promise<any[]> {
        try {
            let isEmpty = this.isEmpty(query);
            if (!isEmpty) {
                this.validQuery(query);
                let result: any = this.processFilter(query["WHERE"]);
                result = this.optionsHelper.doColumnsAndOrder(query, result);
                return Promise.resolve(result);
            }
        } catch (err) {
            return Promise.reject(err);
        }
    }

    private processFilter(query: any): any {
        try {
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
            return err;
        }
    }

    private processStringComparator(query: any, comparator: string) {
        let key: any = Object.keys(query)[0];
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
        let wildCardStart: boolean = false;
        let wildCardEnd: boolean = false;
        let input: string;
        if (val.startsWith("*") && !val.endsWith("*")) {
            input = this.getValidInputString(val.split("*")[1]);
            return (str: string) => {
                return str.endsWith(input);
            };
        }
        if (val.startsWith("*") && val.endsWith("*")) {
            input = this.getValidInputString(val.substring(1, (val.length - 1)));
            return (str: string) => {
                return str.includes(input);
            };
        }
        if (!val.startsWith("*") && val.endsWith("*")) {
            input = this.getValidInputString(val.substring(0, (val.length - 1)));
            return (str: string) => {
                return str.startsWith(input);
            };
        } else {
            input = this.getValidInputString(val);
            return (str: string) => {
                return str === input;
            };
        }
    }

    private getValidInputString(val: string): string {
        if (val.includes("*")) {
            throw new InsightError("Asterisks can only be beginning or end of input string");
        }
        return val;
    }

    private processLogicComparator(query: any, comparator: string): any[] {
        if (comparator === "OR") {
            return this.processOR(query["OR"]);
        }
        if (comparator === "AND") {
            return this.processAND(query["AND"]);
        }
        if (comparator === "NOT") {
            return this.processNOT(query["NOT"]);
        }
    }

    private processAND(query: any): any {
        let result = [];
        if (query === []) {
            throw new InsightError("AND must have at least 1 filter");
        }
        for (let filter of query) {
            result.push(this.processFilter(filter));
        }
        if (result.length <= 1) {
            return result[0];
        } else {
            result = this.getSharedResults(result);
            return result;
        }
    }

    private getSharedResults(array: any[]): any {
        let result: any = new Array<any>();
        result.push(array[0]);
        for (let i of array) {
            result = result.filter((x: any) => (array[i].includes(x)));
        }
        return result;
    }

    private processNOT(query: any): any[] {
        let NOTResult: any = [];
        if (query === []) {
            throw new InsightError("Not must have at least 1 filter");
        }
        if (Object.keys.length > 1) {
            throw new InsightError("Not cannot have more than 1 filter");
        }
        NOTResult = this.processFilter(query);
        return (this.excludeSections(NOTResult));
    }

    private excludeSections(itemsToExclude: any[]): any {
        let result: any = [];
        result = new Array<any>();
        result = this.sections.filter((x: any) => !itemsToExclude.includes(x));
        return result;
    }

    private processOR(query: any): any[] {
        let result: any[] = [];
        if (query === []) {
            throw new InsightError("OR must have at least 1 filter");
        }
        for (let filter in query) {
            result.push(this.processFilter(filter));
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
    public validQuery(query: any): boolean {
        if (!(query.hasOwnProperty("WHERE"))) {
            throw new InsightError("Query missing WHERE section");
        }
        if (!(query.hasOwnProperty("OPTIONS"))) {
            throw new InsightError("Query missing WHERE section");
        }
        if (!(query["OPTIONS"].hasOwnProperty("COLUMNS"))) {
            throw new InsightError("Query missing COLUMNS");
        }
        return true;
    }

    // returns true if query is empty, false if not
    public emptyQuery(query: any): boolean {
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

    private getKeyandCheckIDValid(key: string): string {
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

import {InsightError, NotFoundError, ResultTooLargeError} from "./IInsightFacade";
import DatasetController from "./DatasetController";
import Log from "../Util";
import QueryController from "./QueryController";

const mField = new Set (["avg", "pass", "audit", "fail", "year"]);
const sField = new Set (["dept", "id", "instructor", "title", "uuid"]);
const options = new Set(["COLUMNS", "ORDER"]);

export default class OptionsProcessor {
    private columns: string[];
    private queryController: QueryController;
    private applyKeys: string[];

    constructor(controller: QueryController) {
        this.columns = new Array<string>();
        this.queryController = controller;
        this.applyKeys = [];
    }


    public doOrdering(orderKey: any, results: any): any {
        if (orderKey === null) {
            throw new InsightError("wrong type of key in ORDER");
        }
        let dir = orderKey["dir"];
        let keys = orderKey["keys"];
        let dirKeys = ["UP", "DOWN"];
        if (!orderKey) {
            throw new InsightError("ORDER key cannot be null");
        }
        if (typeof orderKey === "string") {
            if (orderKey.includes("_")) {
                if (!(mField.has(orderKey.split("_")[1]) || sField.has(orderKey.split("_")[1]))) {
                    throw new InsightError("no/invalid keys in ORDER");
                }
            } else {
                if (!this.checkArrayForKey(orderKey, this.columns)) {
                    throw new InsightError("Orderkeys must be in group or apply");
                }
            }
            if (!(this.containsKey(orderKey))) {
                throw new InsightError("ORDER key must be in columns");
            }
            results = results.sort(this.compareOrderUp([orderKey]));
        } else {
            let comparator = Object.keys(orderKey);
            if (comparator.length !== 2 || !comparator.includes("dir") || !comparator.includes("keys")) {
                throw new InsightError("wrong type of keys in ORDER");
            }
            if (!dirKeys.includes(dir)) {
                throw new InsightError("invalid direction");
            }
            if (keys.length === 0) {
                throw new InsightError("Empty Order keys");
            }
            for (let key of keys) {
                if (!(this.containsKey(key))) {
                    throw new InsightError("invalid keys ");
                }
            }
            if (dir === "DOWN") {
                results = results.sort(this.compareOrderDown(keys));
            } else {
                results = results.sort(this.compareOrderUp(keys));
            }
        }
        return results;
    }

    private containsKey(orderKey: string): boolean {
        let hasKey: boolean = false;
        for (let key of this.columns) {
            if (key === orderKey) {
                hasKey = true;
            }
        }
        return hasKey;
    }

    private compareOrderUp(orderKey: string[]): (a: any, b: any) => any {
        return (a: any, b: any) => {
            for (let keys of orderKey) {
                if (a[keys] < b[keys]) {
                    return -1;
                }
                if (a[keys] > b[keys]) {
                    return 1;
                }
            }
            return 0;
        };
    }

    private compareOrderDown(orderKey: string[]): (a: any, b: any) => any {
        return (a: any, b: any) => {
            for (let keys of orderKey) {
                if (a[keys] > b[keys]) {
                    return -1;
                }
                if (a[keys] < b[keys]) {
                    return 1;
                }
            }
            return 0;
        };
    }

    public getColumnKeysNoTRANSFORMATIONS(columns: string[]): any {
        this.columns = [];
        let invalidKeyFound: boolean = false;
        if (columns.length === 0) {
            throw new InsightError("COLUMNS is empty");
        }
        for (let key of columns) {
            if (!(typeof key === "string")) {
                throw new InsightError("COLUMNS values must be strings");
            }
            if (!this.containsKey(key)) {
                    this.queryController.checkIDValid(key);
                    let columnKey: string = key.split("_")[1];
                    if (!(this.queryController.checkValidKey(columnKey))) {
                        invalidKeyFound = true;
                    }
                    this.columns.push(key);
            }
        }
        if (invalidKeyFound) {
            throw new InsightError("Invalid key in COLUMNS");
        }
        if (this.columns.length === 0) {
            throw new InsightError("Empty COLUMNS");
        }
    }

    public getColumnKeysWithTRANSFORMATION(columns: string[], applyKeys: string[], groupKeys: string[]) {
        this.columns = [];
        if (columns.length === 0) {
            throw new InsightError("COLUMNS is empty");
        }
        for (let key of columns) {
            if (!(this.checkArrayForKey(key, applyKeys) || this.checkArrayForKey(key, groupKeys))) {
                throw new InsightError("All keys in COLUMNS must be in GROUP or APPLY when TRANSFORMATIONS present");
            } else {
                this.columns.push(key);
            }
        }
    }


    public getColumnizeFunction(): (section: any) => any {
        return ((section: any) => {
            let columnizedResult: any = {};
            for (let columnKey of this.columns) {
                if (columnKey.includes("_")) {
                    columnizedResult[columnKey] = section[columnKey.split("_")[1]];
                } else {
                    columnizedResult[columnKey] = section[columnKey];
                }
            }
            return columnizedResult;
        });
    }

    private checkArrayForKey(key: string, array: string[]): boolean {
        for (let k of array) {
            if (k === key) {
                return true;
            }
        }
        return false;
    }
}


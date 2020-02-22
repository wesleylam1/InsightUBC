import {InsightError, NotFoundError, ResultTooLargeError} from "./IInsightFacade";
import DatasetController from "./DatasetController";
import Log from "../Util";
import QueryController from "./QueryController";

const mField = new Set (["avg", "pass", "audit", "fail", "year"]);
const sField = new Set (["dept", "id", "instructor", "title", "uuid"]);

const options = new Set(["COLUMNS", "ORDER"]);
export default class OptionsHelper {
    private columns: string[];
    private queryController: QueryController;

    public setController(controller: QueryController) {
        this.queryController = controller;
    }

    constructor() {
        this.columns = new Array<string>();
    }


    public doOrdering(orderKey: any, results: any): any {
        if (!orderKey) {
            throw new InsightError("ORDER key cannot be null");
        }
        if (!(typeof orderKey === "string" && orderKey !== null)) {
            throw new InsightError("wrong type of key in ORDER");
        }
        if (!(mField.has(orderKey.split("_")[1]) || sField.has(orderKey.split("_")[1]))) {
            throw new InsightError("no/invalid keys in ORDER");
        }
        if (!(this.containsKey(orderKey))) {
            throw new InsightError("ORDER key must be in columns");
        }
        results = results.sort(this.compareForOrderFunc(orderKey));
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

    private compareForOrderFunc(orderKey: string): (a: any, b: any) => any {
        return (a: any, b: any) => {
            if (a[orderKey] < b[orderKey]) {
                return -1;
            }
            if (a[orderKey] > b[orderKey]) {
                return 1;
            } else {
                return 0;
            }
        };
    }

    public getColumnKeys(columns: string[]): any {
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
                this.queryController.getKeyandCheckIDValid(key);
                let columnKey: string = key.split("_")[1];
                this.columns.push(key);
                if (!(mField.has(columnKey) || sField.has(columnKey))) {
                    invalidKeyFound = true;
                }
            }
        }
        if (invalidKeyFound) {
            throw new InsightError("Invalid key in COLUMNS");
        }
        if (this.columns.length === 0) {
            throw new InsightError("Empty COLUMNS");
        }
    }

    public getColumnizeFunction(): (section: any) => any {
        return ((section: any) => {
            let columnizedResult: any = {};
            for (let columnKey of this.columns) {
                columnizedResult[columnKey] = section[columnKey.split("_")[1]];
            }
            return columnizedResult;
        });
    }

    public emptyWhere(query: any): any {
        return false;
    }

    // checks that Query has WHERE and  OPTIONS with COLUMNS
    public validQuery(query: any): boolean {
        for (let i of Object.keys(query)) {
            if (! (i === "WHERE" || i === "OPTIONS")) {
                throw new InsightError("Query can only have WHERE and OPTIONS");
            }
        }
        if (!(query.hasOwnProperty("WHERE"))) {
            throw new InsightError("Query missing WHERE section");
        }
        if (!(typeof query["WHERE"] === "object" && query["WHERE"] !== null)) {
            throw new InsightError("WHERE has wrong type");
        }
        if (!(query.hasOwnProperty("OPTIONS"))) {
            throw new InsightError("Query missing OPTIONS section");
        }
        if (query.hasOwnProperty("ORDER")) {
            throw new InsightError("ORDER not in OPTIONS");
        }
        if (!(query["OPTIONS"].hasOwnProperty("COLUMNS"))) {
            throw new InsightError("OPTIONS missing COLUMNS");
        }
        if (!Array.isArray(query["OPTIONS"]["COLUMNS"])) {
            throw new InsightError("COLUMNS must be an array");
        }
        for (let i of Object.keys(query["OPTIONS"])) {
            if (!options.has(i)) {
                throw new InsightError("Invalid key in options");
            }
        }
        return true;
    }
}

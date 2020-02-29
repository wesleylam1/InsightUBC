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

    constructor(controller: QueryController) {
        this.columns = new Array<string>();
        this.queryController = controller;
    }


    public doOrdering(orderKey: any, results: any): any {
        if (!orderKey) {
            throw new InsightError("ORDER key cannot be null");
        }
        if (!(typeof orderKey === "string" && orderKey !== null)) {
            throw new InsightError("wrong type of key in ORDER");
        }
        if (!(this.queryController.checkValidKey(orderKey.split("_")[1]))) {
            throw new InsightError("no/invalid keys in ORDER");
        }
        if (!(this.containsKey(orderKey))) {
            throw new InsightError("ORDER key must be in columns");
        }
        results = results.sort(this.compareForOrderAscending(orderKey));
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

    private compareForOrderAscending(orderKey: string): (a: any, b: any) => any {
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

    private compareForOrderDescending(orderKey: string): (a: any, b: any) => any {
        return (a: any, b: any) => {
            if (a[orderKey] > b[orderKey]) {
                return -1;
            }
            if (a[orderKey] < b[orderKey]) {
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
                this.queryController.checkIDValid(key);
                let columnKey: string = key.split("_")[1];
                this.columns.push(key);
                if (!(this.queryController.checkValidKey(columnKey))) {
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

}


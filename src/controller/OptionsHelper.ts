import {InsightError, NotFoundError, ResultTooLargeError} from "./IInsightFacade";
import DatasetController from "./DatasetController";
import Log from "../Util";
import QueryController from "./QueryController";

const mField = new Set (["avg", "pass", "audit", "fail", "year"]);
const sField = new Set (["dept", "id", "instructor", "title", "uuid"]);
export default class OptionsHelper {
    private columns: string[];
    private queryController: QueryController;

    public setController(controller: QueryController) {
        this.queryController = controller;
    }

    constructor() {
        this.columns = new Array<string>();
    }

    public doColumnsAndOrder(query: any, result: any): any {
        query = query["OPTIONS"];
        this.getColumnKeys(query["COLUMNS"]);
        this.processResultIntoColumns(result);
    }

    private getColumnKeys(columns: string[]): any {
        let invalidKeyFound: boolean = false;
        for (let key of columns) {
            this.queryController.getKeyandCheckIDValid(key);
            let columnKey: string = key.split("_")[1];
            this.columns.push(key);
            if (! (mField.has(columnKey) || sField.has(columnKey))) {
                invalidKeyFound = true;
            }
        }
        if (invalidKeyFound) {
            throw new InsightError("Invalid key in COLUMNS");
        }
        if (this.columns.length === 0) {
            throw new InsightError("Empty COLUMNS");
        }
    }

    private processResultIntoColumns(result: any): any {
        let columnizedResult: any = [];
        let current: any = {};
        for (let section of result) {
            current = {};
            for (let columnKey of this.columns) {
                current[columnKey] = section[columnKey.split("_")[1]];
            }
            columnizedResult.push(current);
        }
        return columnizedResult;
        }
    }

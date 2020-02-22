import {InsightError, NotFoundError, ResultTooLargeError} from "./IInsightFacade";
import DatasetController from "./DatasetController";
import Log from "../Util";
import OptionsHelper from "./OptionsHelper";
import ObjectArrayHelper from "./ObjectArrayHelper";

const mField = new Set(["avg", "pass", "audit", "fail", "year"]);
const sField = new Set(["dept", "id", "instructor", "title", "uuid"]);
const Comparator = new Set(["LT", "GT", "EQ", "IS"]);
const ComparatorALL = new Set(["LT", "GT", "EQ", "IS", "AND", "OR", "NOT"]);
const options = new Set(["COLUMNS", "ORDER"]);

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
            this.optionsHelper.validQuery(query);
            Log.trace("finished validQuery");
            let condition: (section: any) => boolean = this.processFilter(query["WHERE"]);
            let result: any[] = [];
            this.optionsHelper.getColumnKeys(query["OPTIONS"]["COLUMNS"]);
            let columnize: (section: any) => any = this.optionsHelper.getColumnizeFunction();
            for (let section of this.sections) {
                    if (condition(section)) {
                        Log.trace("adding section");
                        result.push(columnize(section));
                        if (result.length > 5000) {
                            throw new ResultTooLargeError("Result exceeded 5000 entries");
                        }
                    }
            }
            if (query["OPTIONS"].hasOwnProperty("ORDER")) {
                result = this.optionsHelper.doOrdering(query["OPTIONS"]["ORDER"], result);
            }
            Log.trace("done filtering");
            return Promise.resolve(result);
        } catch (err) {
            return Promise.reject(err);
        }
    }

    private processFilter(query: any): (section: any) => boolean {
        try {
            if (Object.keys(query).length === 0) {
                this.optionsHelper.emptyWhere(query);
                return (sections: any) => {
                    return true;
                };
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

    private processStringComparator(query: any, comparator: string): (section: any) => boolean {
        if (Object.values(query).length !== 1) {
            throw new InsightError("wrong number of values in " + comparator);
        }
        let key: string = Object.keys(query)[0];
        if (!this.getKeyandCheckIDValid(key)) {
            throw new InsightError("Multiple Datasets not supported");
        }
        Log.trace("splitting in processStringComparator");
        if (!sField.has(key.split("_")[1])) {
            throw new InsightError("used String Comparator with non sField");
        }
        let value: any = query[key];
        if (typeof value !== "string") {
            throw new InsightError("invalid value");
        }
        Log.trace("About to return string comparator");
        return ((section: any) => {
            return this.compareString(key, value, comparator, section);
        });
    }

    private compareString(key: string, value: string, comparator: string, section: any): boolean {
        Log.trace("splitting in compareString");
        let sectionData: string = section[key.split("_")[1]];
        if (comparator === "IS") {
            let compareFunc: (str: string) => boolean = this.makeIsBoolean(value);
            return compareFunc(sectionData);
        }
    }

    private makeIsBoolean(val: string): (str: string) => boolean {
        let input: string = "";
        if (val.startsWith("*") && !val.endsWith("*")) {
            Log.trace("splitting in makeISBoolean branch 1");
            input = this.getValidInputString(val.split("*")[1]);
            return (str: string) => {
 return str.endsWith(input);
};
        }
        if (val.startsWith("*") && val.endsWith("*")) {
            Log.trace("splitting in makeISBoolean branch 2");
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

    private processLogicComparator(query: any, comparator: string): (section: any) => boolean {
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

    private processAND(query: any[]): (section: any) => boolean {
        let conditions: Array<(section: any) => boolean>;
        conditions = new Array<(section: any) => boolean>();
        if (!Array.isArray(query)) {
            throw new InsightError("AND must have at least 1 filter");
        }
        for (let filter of query) {
            Log.trace("pushing in and");
            conditions.push(this.processFilter(filter));
        }
        return ((section: any) => {
            let noFalse: boolean = true;
            for (let c of conditions) {
                if (!(c(section))) {
                    noFalse = false;
                }
            }
            return noFalse;
        });
    }

    private processNOT(query: any): (section: any) => boolean {
        let condition: (section: any) => boolean;
        if (query === []) {
            throw new InsightError("Not must have at least 1 filter");
        }
        if (Object.keys(query)[0] === "NOT") {
            return this.processFilter(query["NOT"]);
        }
        if (Object.keys.length > 1) {
            throw new InsightError("Not cannot have more than 1 filter");
        }
        condition = this.processFilter(query);
        return ((section: any) => {
            return !condition(section);
        });
    }

    private processOR(query: any[]): (section: any) => boolean {
        if (query === []) {
            throw new InsightError("OR must have at least 1 filter");
        }
        let conditions: Array<(section: any) => boolean>;
        conditions = new Array<(section: any) => boolean>();
        for (let filter of query) {
            Log.trace("pushing in OR");
            conditions.push(this.processFilter(filter));
        }
        return ((section: any) => {
            let anyTrue: boolean = false;
            for (let c of conditions) {
                if (c (section)) {
                    anyTrue = true;
                }
            }
            return anyTrue;
        });
        }

    private processMathComparator(query: any, comparator: string): (section: any) => boolean {
        let key: string = Object.keys(query)[0];
        if (!this.getKeyandCheckIDValid(key)) {
            throw new InsightError("Multiple Datasets not supported");
        }
        Log.trace("splitting in mathComparator");
        let keyWithoutID: string = key.split("_")[1];
        if (!mField.has(keyWithoutID)) {
            throw new InsightError("used Math Comparator with non mField");
        }
        if (Object.values(query).length !== 1) {
            throw new InsightError("wrong number of values in " + comparator);
        }
        let value: any = query[key];
        if (typeof value !== "number") {
            throw new InsightError("invalid value");
        }
        return ((section: any) => {
                    return this.compareMath(keyWithoutID, value, comparator, section);
});
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

    public getKeyandCheckIDValid(key: string): string {
        let idstring: string = key;
        Log.trace("Splitting in getKeyandCheckIDValid");
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

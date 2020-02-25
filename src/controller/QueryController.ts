import {InsightError, NotFoundError, ResultTooLargeError} from "./IInsightFacade";
import DatasetController from "./DatasetController";
import Log from "../Util";
import OptionsHelper from "./OptionsHelper";
import ObjectArrayHelper from "./ObjectArrayHelper";
import FilterProcessor from "./FilterProcessor";

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
    private filterProcessor: FilterProcessor;

    public initialize(controller: DatasetController) {
        this.datasetController = controller;
        this.currentDatasetID = null;
        this.sections = null;
        this.optionsHelper = new OptionsHelper();
        this.optionsHelper.setController(this);
        this.filterProcessor = new FilterProcessor(this);
    }

    public performQuery(query: any): Promise<any[]> {
        try {
            this.optionsHelper.validQuery(query);
            let condition: (section: any) => boolean = this.filterProcessor.processFilter(query["WHERE"]);
            let result: any[] = [];
            this.optionsHelper.getColumnKeys(query["OPTIONS"]["COLUMNS"]);
            let columnize: (section: any) => any = this.optionsHelper.getColumnizeFunction();
            for (let section of this.sections) {
                if (condition(section)) {
                    result.push(columnize(section));
                    if (result.length > 5000) {
                        throw new ResultTooLargeError("Result exceeded 5000 entries");
                    }
                }
            }
            if (query["OPTIONS"].hasOwnProperty("ORDER")) {
                result = this.optionsHelper.doOrdering(query["OPTIONS"]["ORDER"], result);
            }
            return Promise.resolve(result);
        } catch (err) {
            return Promise.reject(err);
        }
    }

    public validQuery(query: any): boolean {
        if (!(query.hasOwnProperty("WHERE"))) {
            throw new InsightError("Query missing WHERE section");
        }
        if (!(typeof query["WHERE"] === "object" && query["WHERE"] !== null)) {
            throw new InsightError("WHERE has wrong type");
        }
        if (!(query.hasOwnProperty("OPTIONS"))) {
            throw new InsightError("Query missing OPTIONS section");
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

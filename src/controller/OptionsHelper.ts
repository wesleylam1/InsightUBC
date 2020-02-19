import {InsightError, NotFoundError, ResultTooLargeError} from "./IInsightFacade";
import DatasetController from "./DatasetController";
import Log from "../Util";

const mField = new Set (["avg", "pass", "audit", "fail", "year"]);
const sField = new Set (["dept", "id", "instructor", "title", "uuid"]);
export default class OptionsHelper {
    private columns: Set<string>;


    private checkOptionValidity(query: any): any {
        if (!query.hasOwnProperty("OPTIONS")) {
            throw new InsightError("Missing OPTIONS key");
        }
        if (!query["OPTIONS"].hasOwnProperty("COLUMNS")) {
            throw new InsightError("OPTIONS missing COLUMNS ");
        }
        }

    public doColumnsAndOrder(query: any, result: any): any {
        return [];
    }
}

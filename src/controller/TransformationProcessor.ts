import QueryController from "./QueryController";
import {InsightError} from "./IInsightFacade";


export default class TransformationProcessor {

    private controller: QueryController;

    constructor(controller: QueryController) {
        this.controller = controller;
    }

    public processTransformations(transformations: any): any {
        this.checkValidTransformations(transformations);
        this.doGroup(transformations["GROUP"]);
        return [];
    }

    private checkValidTransformations(transformations: any): void {
        if (!transformations.hasOwnProperty("GROUP")) {
            throw new InsightError("TRANSFORMATIONS must have GROUP");
        }
        if (!transformations.hasOwnProperty("APPLY")) {
            throw new InsightError("TRANSFORMATIONS must have APPLY");
        }
        for (let key of Object.keys(transformations)) {
            if ((key !== "GROUP" ) && (key !== "APPLY")) {
                throw new InsightError("Invalid entry in TRANSFORMATIONS");
            }
        }
    }

    private doGroup(group: any) {
        if (!Array.isArray(group)) {
            throw new InsightError("GROUP must be an array");
        }
        if (group.length === 0) {
            throw new InsightError("GROUP cannot be empty");
        }
        let groupKeys: string[] = this.getGroupKeys(group);


    }

    private getGroupKeys(group: string[]): string[] {
        let result: string[] = [];
        for (let key of group) {
            this.controller.checkIDValid(key);
            if (!this.controller.checkValidKey(key.split("_")[1])) {
                throw new InsightError("invalid key in groups");
            }
            result.push(key);
        }
        return result;

    }
}

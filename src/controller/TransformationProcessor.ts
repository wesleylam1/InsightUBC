import QueryController from "./QueryController";
import {InsightError} from "./IInsightFacade";

const applyTokens = new Set(["MAX", "MIN", "AVG", "COUNT", "SUM"]);
const numericFields = new Set(["lat", "lon", "seats", "avg", "pass", "fail", "audit", "year"]);

interface ApplyRule {
    applyKey: string;
    applyToken: string;
    key: string;
}

export default class TransformationProcessor {

    private controller: QueryController;
    private applyKeys: string[];
    private applyRules: ApplyRule[];

    constructor(controller: QueryController) {
        this.controller = controller;
        this.applyKeys = [];
        this.applyRules = [];
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
        if (!(Object.keys(transformations).length === 2)) {
            throw new InsightError("Too many entries in transformations");
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

    public getApplyKeys(transformations: any) {
        this.checkValidTransformations(transformations);
        let apply: any  = transformations["APPLY"];
        this.checkValidApply(apply);
        for (let applyrule of transformations["APPLY"]) {
            this.processApplyRule(applyrule);
        }
    }

    private checkValidApply(apply: any[]): void {
        if (!Array.isArray(apply)) {
            throw new InsightError("APPLY must be an array");
        }
        if (apply.length === 0) {
            throw new InsightError("APPLY must be a non-empty array");
        }
    }

    private processApplyRule(applyrule: any) {
        this.checkValidApplyRule(applyrule);
        let applyKey = Object.keys(applyrule)[0];
        this.applyKeys.push(applyKey);
    }

    private checkValidApplyRule(applyrule: any) {
       if (!(typeof applyrule === "object" && applyrule !== null) || Array.isArray(applyrule)) {
            throw new InsightError("Invalid applyrule");
        }
       if (Object.values(applyrule).length === 0 || applyrule === {}) {
           throw new InsightError("applyrule cannot be empty");
       }
       if (Object.values(applyrule).length > 1) {
           throw new InsightError("applyrule can only have 1 value");
       }
       let applyKey = Object.keys(applyrule)[0];
       if (applyKey.includes("_")) {
           throw new InsightError("Invalid applyKey");
       }
       if (Object.keys(applyrule[applyKey]).length !== 1) {
           throw new InsightError("Too many keys in applyrule");
       }
       this.checkValidApplyToken(applyrule[applyKey]);
    }

    private checkValidApplyToken(applyToken: any) {
        let token: string = Object.keys(applyToken)[0];
        if (!applyTokens.has(token)) {
            throw new InsightError("Invalid ApplyToken in APPLYRULE");
        }
        if (Object.keys(applyToken).length !== 1) {
            throw new InsightError("APPLY token must have only 1 key");
        }
        if (Object.values(applyToken).length !== 1) {
            throw new InsightError ("Apply Token must have only 1 value");
        }
        if (typeof Object.values(applyToken)[0] !== "string") {
            throw new InsightError("Invalid value in apply token");
        }
        let key: string = Object.values(applyToken)[0].toString();
        this.controller.checkIDValid(key);
        if (!this.controller.checkValidKey(key.split("_")[1])) {
            throw new InsightError("invalid key in applyToken");
        }
        if (token === "MAX" || token === "MIN" || token === "SUM" || token === "AVG") {
            if (!numericFields.has(key.split("_")[1])) {
                throw new InsightError( token + " can only be used with numeric fields");
            }
        }
    }


}

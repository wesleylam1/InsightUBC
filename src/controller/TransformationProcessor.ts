import QueryController from "./QueryController";
import {InsightError, ResultTooLargeError} from "./IInsightFacade";
import Log from "../Util";
import {ApplyRuleFunctionFactory} from "./ApplyRuleFunctionFactory";

const applyTokens = new Set(["MAX", "MIN", "AVG", "COUNT", "SUM"]);
const numericFields = new Set(["lat", "lon", "seats", "avg", "pass", "fail", "audit", "year"]);

export interface ApplyRule {
    aKey: string;
    applyToken: string;
    key: string;
}

export interface IntermediaryGroup {
    groupName?: string;
    groupObject?: any;
    groupContent?: any[];
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

    private checkValidTransformations(transformations: any): void {
        if (!transformations.hasOwnProperty("GROUP")) {
            throw new InsightError("TRANSFORMATIONS must have GROUP");
        }
        if (!transformations.hasOwnProperty("APPLY")) {
            throw new InsightError("TRANSFORMATIONS must have APPLY");
        }
        for (let i of Object.keys(transformations)) {
            if (!(i === "GROUP" || i === "APPLY" )) {
                throw new InsightError("Invalid key in TRANSFORMATIONS");
            }
        }
    }

    public processGroup(group: any, resultSoFar: any[]): any[] {
        this.checkValidGroup(group);
        let groupKeys: string[] = this.getGroupKeys(group);
        let groupedResult = this.formGroups(resultSoFar, groupKeys);
        return groupedResult;
        Log.trace("process group");

    }

    public applyApplyRulestoGroups(groups: IntermediaryGroup[]): any[] {
        for (let aRule of this.applyRules) {
            let applyRuleFunction: (group: IntermediaryGroup) =>
                number = ApplyRuleFunctionFactory.getApplyRuleFunction(aRule.applyToken, aRule.key);
            for (let group of groups) {
                group.groupObject[aRule.aKey] = applyRuleFunction(group);
            }
        }
        return groups;
    }


    private formGroups(array: any[], keys: string[]): any[] {
        let result: IntermediaryGroup[] = [];
        let current: IntermediaryGroup = {};
        for (let i of array) {
            current = {};
            current = (this.getGroupForIndividual(i, result, keys));
            this.processIntoGroup(current, i, keys);
            if (this.groupDoesNotExistYet(current.groupName, result)) {
            result.push(current);
        }
            if (result.length > 5000) {
                throw new ResultTooLargeError("Too many groups");
            }
        }
        return result;
    }

    private processIntoGroup(group: IntermediaryGroup, individual: any, keys: string[]) {
        if (group.groupName === null) {
            group.groupName = this.makeGroupName(individual, keys);
        }
        group.groupContent.push(individual);
        if (group.groupObject === null) {
            group.groupObject = this.makeGroupObject(group, keys);
        }
    }

    private makeGroupObject(group: IntermediaryGroup, keys: string[]): any {
        let result: any = {};
        let individual: any = group.groupContent[0];
        for (let key of keys) {
            let k = key.split("_")[1];
            result[k] = individual[k];
        }
        return result;
    }

    private makeGroupName(individual: any, keys: string[]): string {
        let groupName = "";
        for (let key of keys) {
            let value: any = individual[key.split("_")[1]];
            if ( typeof value !== "string") {
                value = value.toString();
            }
            groupName = groupName + "_" + key.split("_")[1] + ":" + value;
        }
        let list: any[] = groupName.split("_");
        return groupName.substr(1);
    }

    private getGroupForIndividual(indivualResult: any, resultsSoFar: IntermediaryGroup[], keys: string[]): any {
        let result: IntermediaryGroup = {};
        result.groupName = null;
        result.groupObject = null;
        result.groupContent = [];
        for (let i of resultsSoFar) {
            if (this.groupHasMatchingValues(i, indivualResult, keys)) {
                result = i;
                return result;
            }
            }
        return result;
        }


    private groupHasMatchingValues(group: IntermediaryGroup, individualResult: any, keys: string[]): boolean {
        for (let key of keys) {
            let gVal: any = group.groupContent[0][key.split("_")[1]];
            let iVal: any = individualResult[key.split("_")[1]];
            if (!(gVal === iVal)) {
                return false;
            }
        }
        return true;
    }

    public getGroupKeys(group: string[]): string[] {
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

    public getApplyKeys(transformations: any): string[] {
        this.checkValidTransformations(transformations);
        let apply: any  = transformations["APPLY"];
        this.checkValidApply(apply);
        for (let applyrule of transformations["APPLY"]) {
            if (Object.keys(applyrule).length !== 1) {
                throw new InsightError("applyRule cannot be an empty object");
            }
            this.applyRules.push(this.processApplyRule(applyrule));
        }
        return this.applyKeys;
    }

    private checkValidApply(apply: any[]): void {
        if (!Array.isArray(apply)) {
            throw new InsightError("APPLY must be an array");
        }
    }

    private processApplyRule(applyrule: any): ApplyRule {
        this.checkValidApplyRule(applyrule);
        let applyKey: string = Object.keys(applyrule)[0].toString();
        if (this.checkArrayForKey(applyKey, this.applyKeys)) {
            throw new InsightError("each applyKey must be unique");
        }
        this.applyKeys.push(applyKey);
        let newApplyRule: ApplyRule = {
            aKey: applyKey,
        applyToken: Object.keys(applyrule[applyKey])[0],
        key: Object.values(applyrule[applyKey])[0].toString()
    };
        return newApplyRule;
    }

    private checkValidApplyRule(applyrule: any) {
       if (!(typeof applyrule === "object" && applyrule !== null) || Array.isArray(applyrule)) {
            throw new InsightError("Invalid applyrule");
        }
       if (Object.keys(applyrule).length > 1) {
           throw new InsightError("applyrule can only have 1 value");
       }
       if (Object.keys(applyrule).length === 0 || applyrule === {}) {
           throw new InsightError("cannot have no values");
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


    private checkValidGroup(group: any) {
        if (!Array.isArray(group)) {
            throw new InsightError("GROUP must be an array");
        }
        if (group.length === 0) {
            throw new InsightError("GROUP cannot be empty");
        }
    }

    private groupDoesNotExistYet(groupName: string, result: IntermediaryGroup[]): boolean {
        for (let i of result) {
            if (groupName === i.groupName) {
                return false;
            }
        }
        return true;
    }

    public unwrapGroups(groups: IntermediaryGroup[]): any[] {
        let result: any[] = [];
        for (let group of groups) {
            result.push(group.groupObject);
        }
        return result;
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

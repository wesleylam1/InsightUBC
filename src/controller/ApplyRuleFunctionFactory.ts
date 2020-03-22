import {IntermediaryGroup} from "./TransformationProcessor";
import {Decimal} from "decimal.js";

export class ApplyRuleFunctionFactory {

    public static getApplyRuleFunction(applyToken: string, key: string): (group: IntermediaryGroup) => number {
        if (applyToken === "MAX") {
            return ApplyRuleFunctionFactory.getMAXFunction(key);
        }
        if (applyToken === "MIN") {
            return ApplyRuleFunctionFactory.getMINFunction(key);
        }
        if (applyToken === "AVG") {
            return ApplyRuleFunctionFactory.getAVGFunction(key);
        }
        if (applyToken === "SUM") {
            return ApplyRuleFunctionFactory.getSUMFunction(key);
        }
        if (applyToken === "COUNT") {
            return ApplyRuleFunctionFactory.getCOUNTFunction(key);
        }
    }

    public static getMAXFunction(key: string): (group: IntermediaryGroup) => number {
        return ((group: IntermediaryGroup) => {
            let currMax: number = group.groupContent[0][key.split("_")[1]];
            let currVal: number;
            for (let individual of group.groupContent) {
                currVal = individual[key.split("_")[1]];
                if (currVal > currMax) {
                    currMax = currVal;
                }
            }
            return currMax;
        });
    }

    public static getMINFunction(key: string): (group: IntermediaryGroup) => number {
        return ((group: IntermediaryGroup) => {
            let first: any = group.groupContent[0];
            let currMin: number = first[key.split("_")[1]];
            let currVal: number;
            for (let individual of group.groupContent) {
                currVal = individual[key.split("_")[1]];
                if (currVal < currMin) {
                    currMin = currVal;
                }
            }
            return currMin;
        });
    }

    public static getAVGFunction(key: string): (group: IntermediaryGroup) => number {
        return ((group: IntermediaryGroup) => {
            let total: Decimal = new Decimal(0);
            for (let individual of group.groupContent) {
                let val: number = individual[key.split("_")[1]];
                total = Decimal.add(total, new Decimal(val));
            }
            let avg = total.toNumber() / group.groupContent.length;
            let res = Number(avg.toFixed(2));

            return res;
        });
    }

    public static getSUMFunction(key: string): (group: IntermediaryGroup) => number {
        return ((group: IntermediaryGroup) => {
            let sum: number = 0;
            for (let individual of group.groupContent) {
                sum += individual[key.split("_")[1]];
            }
            return Number(sum.toFixed(2));
        });
    }

    public static getCOUNTFunction(key: string): (group: IntermediaryGroup) => number {
        return ((group: IntermediaryGroup ) => {
            let alreadySeen: any = {};
            let count: number = 0;
            for (let individual of group.groupContent) {
                if (!alreadySeen.hasOwnProperty(individual[key.split("_")[1]])) {
                    count ++;
                    alreadySeen[individual[key.split("_")[1]]] = 1;
                }
            }
            return count;
        });
    }
}

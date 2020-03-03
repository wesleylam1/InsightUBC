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
            for (let individual of group.groupContent) {
                if (individual[key] > currMax) {
                    currMax = individual[key];
                }
            }
            return currMax;
        });
    }

    public static getMINFunction(key: string): (group: IntermediaryGroup) => number {
        return ((group: IntermediaryGroup) => {
            let first: any = group.groupContent[0];
            let currMin: number = first[key.split("_")[1]];
            for (let individual of group.groupContent) {
                if (individual[key] < currMin) {
                    currMin = individual[key];
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
                Decimal.add(total, new Decimal(val));
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

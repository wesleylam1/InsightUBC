"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const IInsightFacade_1 = require("./IInsightFacade");
const mField = new Set(["avg", "pass", "audit", "fail", "year"]);
const sField = new Set(["dept", "id", "instructor", "title", "uuid"]);
const Comparator = new Set(["LT", "GT", "EQ", "IS"]);
const ComparatorALL = new Set(["LT", "GT", "EQ", "IS", "AND", "OR", "NOT"]);
class QueryController {
    setDatasetController(controller) {
        this.datasetController = controller;
    }
    performQuery(query) {
        try {
            let isEmpty = this.isEmpty(query);
            if (!isEmpty) {
                return this.validQuery(query).then(function (result) {
                    return this.doQuery(query);
                });
            }
            else {
                return Promise.reject("Invalid Query");
            }
        }
        catch (err) {
            if (err === "NotFoundError") {
                return Promise.reject(new IInsightFacade_1.NotFoundError("Query Not Found"));
            }
            else if (err === "ResultTooLargeError") {
                return Promise.reject(new IInsightFacade_1.ResultTooLargeError("Over 5000 results"));
            }
            else {
                return Promise.reject(new IInsightFacade_1.InsightError("Insight Error Found"));
            }
        }
        return Promise.reject(new IInsightFacade_1.InsightError("Insight Error"));
    }
    processQuery(query) {
        try {
            Util_1.default.trace("reached doQuery");
            let comparator = Object.keys(query)[0];
            if (comparator === "GT" || comparator === "LT" || comparator === "EQ") {
                return this.processMathComparator(query, comparator);
            }
            if (comparator === "IS") {
                return this.processStringComparator(query, comparator);
            }
            if (comparator === "NOT" || comparator === "AND" || comparator === "OR") {
                return this.processLogicComparator(query, comparator);
            }
        }
        catch (err) {
            return err;
        }
    }
    processStringComparator(query, comparator) {
        let key = Object.keys(query)[0];
        if (!this.getKeyandCheckIDValid(key)) {
            throw new IInsightFacade_1.InsightError("Multiple Datasets not supported");
        }
        if (!sField.has(key)) {
            throw new IInsightFacade_1.InsightError("used String Comparator with non sField");
        }
        let value = query[key];
        if (!(typeof value !== "string")) {
            throw new IInsightFacade_1.InsightError("invalid value");
        }
        let result = [];
        if (value)
            for (let section of this.sections) {
                if (this.compareString(key, value, comparator, section)) {
                    result.push(section);
                }
            }
        return result;
    }
    compareString(key, value, comparator, section) {
        let sectionData = section[key];
        let valueRegex = this.getRegex(value);
        if (comparator === "IS") {
        }
    }
    getRegex(value) {
        let length = value.length;
        if ()
            ;
    }
    processLogicComparator(query, comparator) {
        if (comparator === "OR") {
            return this.processOR(query["OR"], comparator);
        }
        if (comparator === "AND") {
            return this.processAND(query["AND"], comparator);
        }
        if (comparator === "NOT") {
            return this.processNOT(query["NOT"], comparator);
        }
    }
    processAND(query, comparator) {
        let result = [];
        if (query === []) {
            throw new IInsightFacade_1.InsightError("AND must have at least 1 filter");
        }
        for (let filter in query) {
            result.push(this.processQuery(filter));
        }
        if (result.length > 1) {
            result = this.getSharedResults(result);
            return result;
        }
        else {
            return result[0];
        }
    }
    getSharedResults(array) {
        let result = [];
        result = new Array();
        result.push(array[0]);
        for (let i = 0; i < array.length; i++) {
            result = result.filter((x) => (array[i].includes(x)));
        }
        return result;
    }
    processNOT(query, comparator) {
        let NOTResult = [];
        if (query === []) {
            throw new IInsightFacade_1.InsightError("Not must have at least 1 filter");
        }
        if (Object.keys.length > 1) {
            throw new IInsightFacade_1.InsightError("Not cannot have more than 1 filter");
        }
        NOTResult = this.processQuery(query);
        return (this.excludeSections(NOTResult));
    }
    excludeSections(itemsToExclude) {
        let result = [];
        result = new Array();
        result = this.sections.filter((x) => !itemsToExclude.includes(x));
        return result;
    }
    processOR(query, comparator) {
        let result = [];
        if (query === []) {
            throw new IInsightFacade_1.InsightError("OR must have at least 1 filter");
        }
        for (let filter in query) {
            result.push(this.processQuery(filter));
        }
        if (result.length > 1) {
            result = this.mergeResults(result);
            return result;
        }
        else {
            return result[0];
        }
    }
    mergeResults(array) {
        let result = [];
        result = new Array();
        result.push(array[0]);
        for (let i = 1; i < array.length; i++) {
            result.concat(array[i]);
        }
        return result;
    }
    processMathComparator(query, comparator) {
        let key = Object.keys(query)[0];
        if (!this.getKeyandCheckIDValid(key)) {
            throw new IInsightFacade_1.InsightError("Multiple Datasets not supported");
        }
        if (!mField.has(key)) {
            throw new IInsightFacade_1.InsightError("used Math Comparator with non mField");
        }
        let value = query[key];
        if (!(typeof value !== "number")) {
            throw new IInsightFacade_1.InsightError("invalid value");
        }
        let result = [];
        for (let section of this.sections) {
            if (this.compareMath(key, value, comparator, section)) {
                if (result.length === 5000) {
                    throw new IInsightFacade_1.ResultTooLargeError("ResultTooLarge");
                }
                result.push(section);
            }
        }
        return result;
    }
    compareMath(key, value, comparator, section) {
        let sectionData = section[key];
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
    isEmpty(query) {
        if (this.emptyQuery(query)) {
            return false;
        }
    }
    validQuery(query) {
        let result = {};
        try {
            let queryWhere = this.WhereFilter(query["WHERE"]);
            let queryOptions = this.OptionsFilter(query["OPTIONS"]);
            result.WHERE = queryWhere;
            result.OPTIONS.COLUMNS = queryOptions;
            return Promise.resolve(result);
        }
        catch (e) {
            if (e.message === "ResultTooLarge") {
                return Promise.reject("ResultTooLarge");
            }
        }
    }
    emptyQuery(query) {
        if (query.OPTIONS.COLUMNS === []) {
            return true;
        }
        if (query.OPTIONS.ORDER === "") {
            return true;
        }
        if (query.WHERE === []) {
            return true;
        }
        else {
            return false;
        }
    }
    CourseData(query) {
        let Filter = Object.keys(query)[0];
        let FilterValue = Object.values(query)[0];
        let key = Filter.substring((Filter.indexOf("_") + 1), (Filter.length));
        let result = {};
        if (!sField.has(Filter[0]) || !mField.has(Filter[0])) {
            throw new IInsightFacade_1.InsightError("invalid key");
        }
        if (sField && !(typeof FilterValue === "string") || mField && !(typeof FilterValue === "number")) {
            throw new IInsightFacade_1.InsightError("values do not match keys");
        }
        if (query === "LT" || query === "GT" || query === "EQ") {
            result.mField = key;
            result.mValue = FilterValue;
        }
        if (query === "IS") {
            result.sField = key;
            result.sValue = FilterValue;
        }
        return result;
    }
    WhereFilter(query) {
        let Filter = Object.keys(query);
        if (Filter.length > 1) {
            throw new IInsightFacade_1.InsightError("more than 1 filter");
        }
        if (Filter.length === 1) {
            if (!(ComparatorALL.has(Filter[0]))) {
                throw new IInsightFacade_1.InsightError("Not a valid Filter");
            }
            else if (Comparator.has(Filter[0])) {
                return this.CourseData(Filter[0]);
            }
            else if (Filter[0] === "NOT") {
                return this.NOTFilter(Filter[0]);
            }
            else {
                return this.AndOrFilter(Filter[0]);
            }
        }
    }
    NOTFilter(query) {
        let Filter = Object.keys(query);
        let result = null;
        if (Filter.length > 1) {
            throw new IInsightFacade_1.InsightError("more than 1 filter");
        }
        if (Filter.length === 1) {
            if (!(ComparatorALL.has(Filter[0]))) {
                throw new IInsightFacade_1.InsightError("Not a valid Filter");
            }
            else if (Comparator.has(Filter[0])) {
                result = QueryController.CourseData(Filter[0]);
            }
            else if (Filter[0] === "NOT") {
                result = QueryController.NOTFilter(Filter[0]);
            }
            else {
                result = QueryController.AndOrFilter(Filter[0]);
            }
        }
        let results;
        results.NOT = result;
        return results;
    }
    AndOrFilter(query) {
        let Filter = Object.keys(query);
        let result = {};
        let element = {};
        if (Filter.length > 1) {
            throw new IInsightFacade_1.InsightError("more than 1 filter");
        }
        if (Filter.length === 1) {
            if (!(ComparatorALL.has(Filter[0]))) {
                throw new IInsightFacade_1.InsightError("Not a valid Filter");
            }
            else if (Comparator.has(Filter[0])) {
                element = this.CourseData(Filter[0]);
            }
            else if (Filter[0] === "NOT") {
                element = this.NOTFilter(Filter[0]);
            }
            else {
                element = this.AndOrFilter(Filter[0]);
            }
        }
        if (query === "AND") {
            result.AND.push(element);
        }
        else {
            result.OR.push(element);
        }
        return result;
    }
    OptionsFilter(query) {
        let Filter = Object.keys(query);
        let FilterValue = Object.values(query);
        let resultArray;
        let resultOrder = "";
        if (Filter.length > 2 || Filter.length === 0) {
            throw new IInsightFacade_1.InsightError("invalid Options Filter");
        }
        if (Filter.length === 2) {
            for (let element of Filter) {
                if (element === "COLUMNS") {
                    resultArray = this.columnsFilter(query["COLUMNS"]);
                }
                else if (element === "ORDER") {
                    resultOrder = this.orderFilter(query["ORDER"], query["COLUMNS"]);
                }
                else {
                    throw new IInsightFacade_1.InsightError("invalid Options Filter");
                }
            }
        }
        resultArray.push(resultOrder);
        return resultArray;
    }
    orderFilter(order, columns) {
        if (columns.includes(order)) {
            return order;
        }
        else {
            throw new IInsightFacade_1.InsightError("Order not in Columns");
        }
    }
    columnsFilter(query) {
        let resultArray;
        if (!Array.isArray(query) || query.length === 0) {
            throw new IInsightFacade_1.InsightError("Invalid Column");
        }
        for (let element of query) {
            resultArray.push(element);
        }
        return resultArray;
    }
    getKeyandCheckIDValid(id) {
        let idstring = id.split("_", 1)[0];
        if (idstring !== this.currentDatasetID) {
            throw new IInsightFacade_1.InsightError("Multiple Datasets not supported");
        }
        return idstring;
    }
}
exports.default = QueryController;
//# sourceMappingURL=QueryController.js.map
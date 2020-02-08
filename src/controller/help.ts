import Log from "../Util";
import {expect} from "chai";
import * as fs from "fs";
import PerformQueryHelper from "./performQueryHelper";
import {start} from "repl";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

export interface ICourseData {
    dept: string;       id: string;
    instructor: string; title: string;
    pass: number;       fail: number;
    audit: number;      uuid: string;
    avg: number;        year: number;
    filename: string;
}
interface ICourseHash {
    [key: string]: ICourseData[];
}

interface IQuery {
    Where?: IFilter;
    Options?: {
        Columns: string[];
        Order?: string;
    };
}

interface IFilter {
    AND?: IFilter[];
    OR?: IFilter[];
    NOT?: IFilter;
    sOperator?: string;
    mOperator?: string;
    idfield?: string;
    MathField?: string;
    MathValue?: number;
    StringField?: string;
    StringValue?: string;
}

const qSet = new Set(["WHERE", "OPTIONS"]);
const TSet = new Set(["WHERE", "OPTIONS"]);

export function processFilterS(Course: ICourseData, Field: string, Value: string, Op: string, logic: string): boolean {
    let bool: boolean;
    let startWild: boolean;
    let endWild: boolean;
    let bothWild: boolean;
    let noWild: boolean;
    startWild = (Value.charAt(0) !== "*" && Value.charAt(Value.length - 1) === "*");
    endWild =   (Value.charAt(0) === "*" && Value.charAt(Value.length - 1) !== "*");
    bothWild =  (Value.charAt(0) === "*" && Value.charAt(Value.length - 1) === "*");
    noWild = !Value.includes("*");
    let checkStr: string = "default";
    if (Field === "dept") {
        checkStr = Course.dept;
    } else if (Field === "id") {
        checkStr = Course.id;
    } else if (Field === "instructor") {
        checkStr = Course.instructor;
    } else if (Field === "title") {
        checkStr = Course.title;
    } else if (Field === "uuid") {
        checkStr = Course.uuid;
    }
    if (checkStr === "default") {
        return false;
    } else if (startWild) {
        bool = (checkStr.slice(0, Value.length - 1).includes(Value.slice(0, -1), 0));
    } else if (endWild) {
        bool = (checkStr.includes(Value.slice(1), (checkStr.length - (Value.length - 1))));
    } else if (bothWild) {
        bool = (checkStr.includes(Value.slice(1, -1)));
    } else if (noWild) {
        bool = (checkStr === Value);
    }
    if (logic === "not") {
        return !(bool);
    } else {
        return bool;
    }
}
export function processFilterM(Course: ICourseData, Field: string, Value: number, Op: string, logic: string): boolean {
    let bool: boolean;
    let checkVal: number = -1;
    if (Field === "pass") {
        checkVal = Course.pass;
    } else if (Field === "fail") {
        checkVal = Course.fail;
    } else if (Field === "avg") {
        checkVal = Course.avg;
    } else if (Field === "audit") {
        checkVal = Course.audit;
    } else if (Field === "year") {
        checkVal = Course.year;
    }
    if (checkVal === -1) {
        return false;
    } else if (Op === "GT") {
        bool = (checkVal > Value);
    } else if (Op === "LT") {
        bool = (checkVal < Value);
    } else if (Op === "EQ") {
        bool = (checkVal === Value);
    }
    if (logic === "not") {
        return !(bool);
    } else {
        return bool;
    }
}

export function getColumnValues(col: string, obj: { [p: string]: any }, c: ICourseData) {
    let swch = col.split("_")[1];
    if (swch === "dept") {
        obj[col] = c.dept;
    } else if (swch === "id") {
        obj[col] = c.id;
    } else if (swch === "instructor") {
        obj[col] = c.instructor;
    } else if (swch === "title") {
        obj[col] = c.title;
    } else if (swch === "uuid") {
        obj[col] = c.uuid;
    } else if (swch === "pass") {
        obj[col] = c.pass;
    } else if (swch === "fail") {
        obj[col] = c.fail;
    } else if (swch === "audit") {
        obj[col] = c.audit;
    } else if (swch === "avg") {
        obj[col] = c.avg;
    } else if (swch === "year") {
        obj[col] = c.year;
    }
}

class CourseDatabase {
    public courseObjectList?: ICourseHash;
    public datasetIDList?: string[];

    constructor() {
        this.courseObjectList = {};
        this.datasetIDList = [];
    }
}

export function searchWithFilter(filter: IFilter, logic: string, database: CourseDatabase): ICourseData[] {
    let returnArr: ICourseData[] = [];
    if (logic === "not") {
        if (filter.OR) {
            returnArr = filterAndHelper(filter.OR, filter, database, logic, returnArr);
        } else if (filter.AND) {
            returnArr = filterOrHelper(filter.AND, filter, database, logic, returnArr);
        } else if (filter.NOT) {
            returnArr = returnArr.concat(searchWithFilter(filter.NOT, "none", database));
        } else {
            returnArr = filterSearchHelper(filter, database, logic, returnArr);
        }
    } else {
        if (filter.AND) {
            returnArr = filterAndHelper(filter.AND, filter, database, logic, returnArr);
        } else if (filter.OR) {
            returnArr = filterOrHelper(filter.OR, filter, database, logic, returnArr);
        } else if (filter.NOT) {
            returnArr = returnArr.concat(searchWithFilter(filter.NOT, "not", database));
        } else {
            returnArr = filterSearchHelper(filter, database, logic, returnArr);
        }
    }
    return returnArr;
}
function filterAndHelper(logArr: IFilter[], filter: IFilter,  database: CourseDatabase, logic: string,
                         returnArr: ICourseData[]): ICourseData[] {
    let andArray: ICourseData[][] = [];
    for (let x of logArr) {
        andArray.push(searchWithFilter(x, logic, database));
    }
    returnArr = andArray[0];
    for (let a of andArray) {
        returnArr = returnArr.filter((value) => {
            return -1 !== a.indexOf(value);
        });
    }
    return returnArr;
}
function filterOrHelper(logArr: IFilter[], filter: IFilter,  database: CourseDatabase, logic: string,
                        returnArr: ICourseData[]): ICourseData[] {
    let orArray: ICourseData[][] = [];
    for (let x of logArr) {
        orArray.push(searchWithFilter(x, logic, database));
    }
    returnArr = orArray[0];
    for (let o of orArray) {
        for (let ox of o) {
            if (returnArr.indexOf(ox) === -1) {
                returnArr.push(ox);
            }
        }
    }
    return returnArr;
}
function filterSearchHelper(filter: IFilter,  database: CourseDatabase, logic: string,
                            returnArr: ICourseData[]) {
    if (filter.mOperator) {
        for (let i of database.courseObjectList[filter.idfield]) {
            if (processFilterM(i, filter.MathField, filter.MathValue, filter.mOperator, logic)) {
                returnArr.push(i);
            }
        }
    } else if (filter.sOperator) {
        for (let i of database.courseObjectList[filter.idfield]) {
            if (processFilterS(i, filter.StringField, filter.StringValue, filter.sOperator, logic)) {
                returnArr.push(i);
            }
        }
    } else {
        returnArr = database.courseObjectList[database.datasetIDList[0]];
    }
    return returnArr;
}

export function makeJsonObject(obj: object, flnm: string): ICourseData {
    let ob = JSON.parse(JSON.stringify(obj));
    let dept = "default";
    let id = "default";
    let instruct = "default";
    let title = "default";
    let pass = -1;
    let fail = -1;
    let aud = -1;
    let uuid = "default";
    let yr = -1;
    let ave = -1;
    if (ob.hasOwnProperty("Subject")) {
        dept = ob["Subject"];
    }
    if (ob.hasOwnProperty("Course")) {
        id = ob["Course"];
    }
    if (ob.hasOwnProperty("Professor")) {
        instruct = ob["Professor"];
    }
    if (ob.hasOwnProperty("Title")) {
        title = ob["Title"];
    }
    if (ob.hasOwnProperty("Pass")) {
        pass = ob["Pass"];
    }
    if (ob.hasOwnProperty("Fail")) {
        fail = ob["Fail"];
    }
    if (ob.hasOwnProperty("Audit")) {
        aud = ob["Audit"];
    }
    if (ob.hasOwnProperty("id")) {
        uuid = ob["id"].toString();
    }
    if (ob.hasOwnProperty("Section") && ob["Section"] === "overall") {
        yr = 1900;
    } else if (ob.hasOwnProperty("Year")) {
        yr = Number(ob["Year"]);
    }
    if (ob.hasOwnProperty("Avg")) {
        ave = ob["Avg"];
    }
    return {dept: dept, id: id, instructor: instruct, title: title, pass: pass, fail: fail, audit: aud,
        uuid: uuid, year: yr, avg: ave, filename: flnm};
}

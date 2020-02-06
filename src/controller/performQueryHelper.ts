import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";

export interface Queries {
    WHERE: {};
    OPTIONS: {
        COLUMNS: string[];
        ORDER: string;
    };
}

export interface Filters {
    AND: Filters[];
    OR: Filters[];
    NOT: Filters;
    mField: string;
    mValue: number;
    sField: string;
    sValue: string;
}

export interface CourseData {
    dept: string;
    id: string;
    avg: number;
    instructor: string;
    title: string;
    pass: number;
    fail: number;
    audit: number;
    uuid: string;
    year: number;

}

export default class PerformQueryHelper  {

    public static isValid (query: any): boolean {
        if (this.emptyQuery(query)) {
            return false;
        }
        if (this.invalidCourseData(query)) {
            return false;
        }
        if (this.invalidFilters(query)) {
            return false;
        }
        if (this.invalidCourseData(query)) {
            return false;
        }
        if (this.invalidQueries(query)) {
            return false;
        } else {
            return true;
        }
    }

    public static validQuery (query: any): Promise<any> {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return new Promise(function (reject) {});
    }

    public static emptyQuery(query: any): boolean {
        return false;

    }

    public static invalidCourseData(query: any): boolean {
        return false;

    }

    public static invalidFilters(query: any): boolean {
        return false;

    }

    public static invalidQueries(query: any): boolean {
        return false;

    }

}

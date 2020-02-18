import {InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {Course} from "./Course";

export class Dataset {
    public id: string;
    public datatype: InsightDatasetKind;
    public courses: Course[] = [];

    constructor(id: string, datatype: InsightDatasetKind, courses: Course[]) {
        this.id = id;
        this.datatype = datatype;
        this.courses = courses;
    }

    public push(course: Course) {
        this.courses.push(course);
    }

    public generateInsightDataset(): InsightDataset {
        let insightDataset: InsightDataset = {id: null, kind: null, numRows: null};
        insightDataset.id = this.id;
        insightDataset.kind = this.datatype;
        insightDataset.numRows = this.courses.length;
        return insightDataset;
    }
}

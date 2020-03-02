import {InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {Course} from "./Course";
import {Room} from "./Room";

export interface Dataset {
    id: string;
    datatype: InsightDatasetKind;
    data: object[];

    generateInsightDataset(): InsightDataset;
}

export class CourseDataset implements Dataset {
    public id: string;
    public datatype: InsightDatasetKind;
    public data: Course[] = [];

    constructor(id: string, datatype: InsightDatasetKind, courses: Course[]) {
        this.id = id;
        this.datatype = datatype;
        this.data = courses;
    }

    public generateInsightDataset(): InsightDataset {
        let insightDataset: InsightDataset = {id: null, kind: null, numRows: null};
        insightDataset.id = this.id;
        insightDataset.kind = this.datatype;
        insightDataset.numRows = this.data.length;
        return insightDataset;
    }

}

export class RoomDataset implements Dataset {
    public id: string;
    public datatype: InsightDatasetKind;
    public data: Room[] = [];

    constructor(id: string, datatype: InsightDatasetKind, rooms: Room[]) {
        this.id = id;
        this.datatype = datatype;
        this.data = rooms;
    }

    public generateInsightDataset(): InsightDataset {
        let insightDataset: InsightDataset = {id: null, kind: null, numRows: null};
        insightDataset.id = this.id;
        insightDataset.kind = this.datatype;
        insightDataset.numRows = this.data.length;
        return insightDataset;
    }
}

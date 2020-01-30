import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./controller/IInsightFacade";

class IndividualDataSet {
}

class InsightDatasetConcrete implements InsightDataset {
    public id: string;
    public kind: InsightDatasetKind;
    public numRows: number;
    private content: IndividualDataSet[];

    constructor(id: string, kind: InsightDatasetKind, numRows: number) {
        this.id = id;
        this.kind = kind;
        this.numRows = numRows;
    }

}

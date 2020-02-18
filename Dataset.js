"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Dataset {
    constructor(id, datatype, courses) {
        this.courses = [];
        this.id = id;
        this.datatype = datatype;
        this.courses = courses;
    }
    push(course) {
        this.courses.push(course);
    }
    generateInsightDataset() {
        let insightDataset = { id: null, kind: null, numRows: null };
        insightDataset.id = this.id;
        insightDataset.kind = this.datatype;
        insightDataset.numRows = this.courses.length;
        return insightDataset;
    }
}
exports.Dataset = Dataset;
//# sourceMappingURL=Dataset.js.map
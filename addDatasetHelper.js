"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("./IInsightFacade");
function verifyAddDataset(id, content, kind) {
    if (!id || id.includes("_") || id.trim() === "" || id === "") {
        throw new IInsightFacade_1.InsightError("Invalid ID");
    }
    if (!content || content === "") {
        throw new IInsightFacade_1.InsightError("Invalid content");
    }
    if (kind !== IInsightFacade_1.InsightDatasetKind.Courses && kind !== IInsightFacade_1.InsightDatasetKind.Rooms) {
        throw new IInsightFacade_1.InsightError("Invalid dataset type");
    }
}
exports.verifyAddDataset = verifyAddDataset;
function checkDuplicates(id, map) {
    if (map.has(id)) {
        throw new IInsightFacade_1.InsightError("Duplicate ID");
    }
}
exports.checkDuplicates = checkDuplicates;
//# sourceMappingURL=AddDatasetHelper.js.map
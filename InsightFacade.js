"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const DatasetController_1 = require("./DatasetController");
const QueryController_1 = require("./QueryController");
class InsightFacade {
    constructor() {
        Util_1.default.trace("InsightFacadeImpl::init()");
        this.DatasetController = new DatasetController_1.default();
        this.DatasetController.readFromDisk();
        this.QueryController = new QueryController_1.default();
        this.QueryController.setDatasetController(this.DatasetController);
    }
    addDataset(id, content, kind) {
        return this.DatasetController.addDataset(id, content, kind);
    }
    removeDataset(id) {
        return this.DatasetController.removeDataset(id);
    }
    performQuery(query) {
        return this.QueryController.performQuery(query);
    }
    listDatasets() {
        return this.DatasetController.listDatasets();
    }
}
exports.default = InsightFacade;
//# sourceMappingURL=InsightFacade.js.map
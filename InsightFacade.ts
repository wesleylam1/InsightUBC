import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import {checkDuplicates, verifyAddDataset} from "./AddDatasetHelper";
import * as JSZip from "jszip";
import {Course, readCourseData} from "./Course";
import {Dataset} from "./Dataset";
import * as fs from "fs";
import AddDatasetController from "./AddDatasetController";
import DatasetController from "./DatasetController";
import QueryController from "./QueryController";



/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    private DatasetController: DatasetController;
    private QueryController: QueryController;
    this

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.DatasetController = new DatasetController();
        this.DatasetController.readFromDisk();
        this.QueryController = new QueryController();
        this.QueryController.setDatasetController(this.DatasetController);
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return this.DatasetController.addDataset(id, content, kind);
    }

    public removeDataset(id: string): Promise<string> {
        return this.DatasetController.removeDataset(id);
    }

    public performQuery(query: any): Promise<any[]> {
        return this.QueryController.performQuery(query);
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return this.DatasetController.listDatasets();
    }
}

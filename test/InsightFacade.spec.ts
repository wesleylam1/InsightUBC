import { expect } from "chai";
import * as fs from "fs-extra";
import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string;  // This is injected when reading the file
}

describe("InsightFacade Add/Remove/List Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]).toString("base64");
        }
    });

    beforeEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs before each test, which should make each test independent from the previous one
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // This is a unit test. You should create more like this!
    it("Should add a valid dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });

    });

    // test add dataset with .Room kind
    it("Should add a valid dataset with room kind", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });

    });


    // tests with dataset with Valid Invalid Valid course data
    it("Should add a valid dataset, skipping one course", function () {
        const id: string = "coursesVIV";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });

    });

    // test with empty dataset
    it("Should fail to add empty Dataset", function () {
        const id: string = "coursesEmpty";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "should have rejected");
        }).catch(function (err: InsightError) {
            expect(err).be("InsightError");
        });
    });

    // test duplicate adds
    it("Should fail to add duplicate Dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((res: string[]) => {
            return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
                expect.fail(result, expected, "should have rejected");
            }).catch(function (err: InsightError) {
                expect(err).be("InsightError");
            });
        });
    });

    // test with empty dataset with rooms type
    it("Should fail to add empty Dataset rooms kind", function () {
        const id: string = "coursesEmpty";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect.fail(result, expected, "should have rejected");
        }).catch(function (err: InsightError) {
            expect(err).be("InsightError");
        });
    });

    // test with bad id dataset
    it("Should fail to add  bad id", function () {
        const id: string = "        ";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "should have rejected");
        }).catch(function (err: InsightError) {
            expect(err).be("InsightError");
        });
    });

    // test with nonexisted id dataset
    it("Should fail to add nonexistent id", function () {
        const id: string = "coursesNoExist";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "should have rejected");
        }).catch(function (err: NotFoundError) {
            expect(err).be("NotFoundError");
        });
    });

    // test with bad id dataset
    it("Should fail to add underscore id", function () {
        const id: string = " courses _   such   ";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "should have rejected");
        }).catch(function (err: InsightError) {
            expect(err).be("InsightError");
        });
    });

    // test with bad id dataset
    it("Should fail to remove  bad id", function () {
        const id: string = "        ";
        const expected: string[] = [id];
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail(result, expected, "should have rejected");
        }).catch(function (err: InsightError) {
            expect(err).be("InsightError");
        });
    });

    // test with bad id dataset
    it("Should fail to remove underscore id", function () {
        const id: string = " courses _   such   ";
        const expected: string[] = [id];
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail(result, expected, "should have rejected");
        }).catch(function (err: InsightError) {
            expect(err).be("InsightError");
        });
    });


    // test with invalid dataset
    it("Should fail to add invalid Dataset", function () {
        const id: string = "invalidType";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "should have rejected");
        }).catch(function (err: InsightError) {
            expect(err).be("InsightError");
        });
    });

    // test for removing not added yet
    it("Should fail to remove not added Dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail(result, expected, "should have rejected");
        }).catch(function (err: NotFoundError) {
            expect(err).be("NotFoundError");
        });
    });

    // test for removing added fixed removal chaining
    it("Should  remove added Dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
                return insightFacade.removeDataset(id).then((res: string) => {
                    expect(res).to.deep.equal(expected);
                }).catch(function (err: any) {
                    expect.fail(err, expected, "should not have rejected");
                });
            }
        );
    });

    // test for removing added fixed removal chaining
    it("Should  remove added .ROOMs Dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
                return insightFacade.removeDataset(id).then((res: string) => {
                    expect(res).to.deep.equal(expected);
                }).catch(function (err: any) {
                    expect.fail(err, expected, "should not have rejected");
                });
            }
        );
    });

    // test for removing added fixed removal chaining
    it("Should  fail to double remove Dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
                return insightFacade.removeDataset(id).then((res: string) => {
                    return insightFacade.removeDataset(id).then((re: string) => {
                        expect.fail(re, expected, "should not have fulfilled");
                    });
                }).catch(function (err: any) {
                    expect(err).be("InsightError");
                });
            }
        );
    });

    // test for adding invalid type
    it("Should fail to add invalid Dataset", function () {
        const id: string = "invalidType";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "should have rejected");
        }).catch(function (err: InsightError) {
            expect(err).be("InsightError");
        });
    });

    // Test of listing added dataset
    it("Should add then list", function () {
        const id: string = "coursesVIV";
        const expected: InsightDataset = {id: "coursesVIV", kind: InsightDatasetKind.Courses, numRows: 1};
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((res: string[]) => {
            return insightFacade.listDatasets().then((result: InsightDataset[]) => {
                expect(result).to.deep.equal(expected);
            }).catch((err: any) => {
                expect.fail(err, expected, "Should not have rejected");
            });
        });
    });

    // List no datasets
    it("Should  list nothing", function () {
        const id: string = "courses";
        const expected: string = "doesnt matter";
        return insightFacade.listDatasets().then((result: InsightDataset[]) => {
            expect(result);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

});


/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: { [id: string]: {path: string, kind: InsightDatasetKind} } = {
        courses: {path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        insightFacade = new InsightFacade();
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(id, data, ds.kind));
        }
        return Promise.all(loadDatasetPromises).catch((err) => {
            /* *IMPORTANT NOTE: This catch is to let this run even without the implemented addDataset,
             * for the purposes of seeing all your tests run.
             * TODO For C1, remove this catch block (but keep the Promise.all)
             */
            return Promise.resolve("HACK TO LET QUERIES RUN");
        });
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function (done) {
                    insightFacade.performQuery(test.query).then((result) => {
                        TestUtil.checkQueryResult(test, result, done);
                    }).catch((err) => {
                        TestUtil.checkQueryResult(test, err, done);
                    });
                });
            }
        });
    });
});

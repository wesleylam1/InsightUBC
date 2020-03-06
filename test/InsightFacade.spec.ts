import {expect} from "chai";
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
        invalid: "./test/data/Invalid.zip",
        empty: "./test/data/empty.zip",
        rooms: "./test/data/rooms.zip",
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
    it("Should add a valid dataset (courses)", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: Error) => {
            expect.fail(err, expected, "Should not have rejected");
        });

    });

    it("Should add a valid dataset (rooms)", function () {
        const id: string = "rooms";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });


   /* // test with empty dataset
    it("Should fail to add empty Dataset", function () {
        const id: string = "coursesEmpty";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "should have rejected");
        }).catch(function (err: InsightError) {
            expect(err);
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
                expect(err);
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
            expect(err);
        });
    });

    // test with bad id dataset
    it("Should fail to add  bad id", function () {
        const id: string = "        ";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "should have rejected");
        }).catch(function (err: InsightError) {
            expect(err);
        });
    });

    // test with nonexisted id dataset
    it("Should fail to add nonexistent id", function () {
        const id: string = "coursesNoExist";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "should have rejected");
        }).catch(function (err: NotFoundError) {
            expect(err);
        });
    });

    // test with bad id dataset
    it("Should fail to add underscore id", function () {
        const id: string = " courses _   such   ";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "should have rejected");
        }).catch(function (err: InsightError) {
            expect(err);
        });
    });

    // test with bad id dataset
    it("Should fail to remove  bad id", function () {
        const id: string = "        ";
        const expected: string[] = [id];
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail(result, expected, "should have rejected");
        }).catch(function (err: InsightError) {
            expect(err);
        });
    });

    // test with bad id dataset
    it("Should fail to remove underscore id", function () {
        const id: string = " courses _   such   ";
        const expected: string[] = [id];
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail(result, expected, "should have rejected");
        }).catch(function (err: InsightError) {
            expect(err);
        });
    });


    // test with invalid dataset
    it("Should fail to add invalid Dataset", function () {
        const id: string = "invalidType";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "should have rejected");
        }).catch(function (err: InsightError) {
            expect(err);

        });
    });

    it("Should fail to add null string", function () {
        const id: string = "null";
        const expected: string[] = [id];
        return insightFacade.addDataset(null, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "should have rejected");
        }).catch(function (err: InsightError) {
            expect(err);

        });
    });

    // test for removing not added yet
    it("Should fail to remove not added Dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail(result, expected, "should have rejected");
        }).catch(function (err: NotFoundError) {
            expect(err);
        });
    });

    it("Should fail to remove null string Dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.removeDataset(null).then((result: string) => {
            expect.fail(result, expected, "should have rejected");
        }).catch(function (err: InsightError) {
            expect(err);
        });
    });

    // test for removing added fixed removal chaining
    it("Should  remove added Dataset", function () {
        const id: string = "courses";
        const expected: string = "courses";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
                return insightFacade.removeDataset(id).then((res: string) => {
                    expect(res).to.deep.equal(expected);
                }).catch(function (err: any) {
                    expect.fail(err, expected, "should not have rejected");
                });
            }
        );
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
    it("Should add a valid dataset - whitespace name", function () {

        const id: string = "courses copy";
        const expected: string[] = [id];
        return insightFacade
            .addDataset(id, datasets["courses"], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect(result).to.deep.equal(expected);
            })
            .catch((err: any) => {
                expect.fail(err, expected, "Should not have rejected");
            });
    });
    it("Should fail adding an invalid dataset", function () {
        const id: string = "emptyzip";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, InsightError, "Should have failed");
            })
            .catch((err) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });
    it("Should fail adding an invalid dataset: empty json", function () {
        const id: string = "empty";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, InsightError, "Should have failed");
            })
            .catch((err) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });
    it("Should fail adding: invalid ID (underscore)", function () {
        const id: string = "courses_2";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, InsightError, "Should have failed");
            })
            .catch((err) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });
    it("Should fail adding: invalid name (whitespace)", function () {
        const id: string = "  ";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, InsightError, "Should have failed");
            })
            .catch((err) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });
    it("Should fail adding: invalid name (empty string)", function () {
        const id: string = "";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, InsightError, "Should have failed");
            })
            .catch((err) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });
    it("Should fail adding: invalid name (null)", function () {
        const id: string = null;
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, InsightError, "Should have failed");
            })
            .catch((err) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });
    it("Should fail adding: invalid name (undefined)", function () {
        const id: string = undefined;
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, InsightError, "Should have failed");
            })
            .catch((err) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });
    it("Should fail adding: duplicate id", function () {
        const id: string = "courses";
        const expect1: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect(result).to.deep.equal(expect1);
                insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
                    .then((res: any) => {
                        expect.fail(res, InsightError, "Should have thrown");
                    })
                    .catch((err) => {
                        expect(err).to.be.instanceOf(InsightError);
                    });
            })
            .catch((err) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });
    it("Should fail adding: non-existent dataset", function () {
        const id: string = "doesnotexist";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, InsightError, "Should have failed");
            })
            .catch((err) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });
    it("Should fail adding: non-existent content", function () {
        const id: string = "courses";
        return insightFacade
            .addDataset(id, "", InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, InsightError, "Should have failed");
            })
            .catch((err) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });
    it("Should fail adding: null content", function () {
        const id: string = "courses";
        return insightFacade
            .addDataset(id, null, InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, InsightError, "Should have failed");
            })
            .catch((err) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });
    it("Should fail adding: undefined content", function () {
        const id: string = "courses";
        return insightFacade
            .addDataset(id, undefined, InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, InsightError, "Should have failed");
            })
            .catch((err) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });
    it("Should fail adding: wrong kind (rooms)", function () {
        const id: string = "courses";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Rooms)
            .then((result: string[]) => {
                expect.fail(result, InsightError, "Should have failed");
            })
            .catch((err) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });
    it("Should fail adding: wrong kind (null)", function () {
        const id: string = "courses";
        return insightFacade
            .addDataset(id, datasets[id], null)
            .then((result: string[]) => {
                expect.fail(result, InsightError, "Should have failed");
            })
            .catch((err) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });
    it("Should fail adding: wrong kind (undefined)", function () {
        const id: string = "courses";
        return insightFacade
            .addDataset(id, datasets[id], undefined)
            .then((result: string[]) => {
                expect.fail(result, InsightError, "Should have failed");
            })
            .catch((err) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });
    it("Should fail added: invalid zip", function () {
        const id: string = "invalid";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, InsightError, "Should have failed");
            })
            .catch((err) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });
    it("Should remove a valid dataset", function () {
        const id: string = "courses";
        const expected: string = "courses";
        const expect1: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect(result).to.deep.equal(expect1);
                insightFacade.removeDataset(id)
                    .then((res: string) => {
                        expect(res).to.equal(expected);
                    });
            })
            .catch((err: any) => {
                expect.fail(err, expected, "Should not have failed");
            });
    });
    it("Try and remove a database twice", function () {
        const id: string = "courses";
        const expected: string = "courses";
        insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return insightFacade
            .removeDataset(id)
            .then((result: string) => {
                expect(result).to.equal(expected);
                insightFacade
                    .removeDataset(id)
                    .then((res: string) => {
                        expect.fail(res, InsightError, "Should have failed");
                    });
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(NotFoundError);
            });
    });
    it("Should fail removing dataset: no valid ID found", function () {
        const id: string = "testremove";
        return insightFacade
            .removeDataset(id)
            .then((result: string) => {
                expect.fail(result, InsightError, "Should have failed");
            })
            .catch((err) => {
                expect(err).to.be.instanceOf(NotFoundError);
            });
    });
    it("Should fail removing dataset: invalid ID (underscore)", function () {
        const id: string = "test_remove";
        return insightFacade
            .removeDataset(id)
            .then((result: string) => {
                expect.fail(result, InsightError, "Should have failed");
            })
            .catch((err) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });
    it("Should fail removing dataset: invalid ID (whitespace)", function () {
        const id: string = " ";
        return insightFacade
            .removeDataset(id)
            .then((result: string) => {
                expect.fail(result, InsightError, "Should have failed");
            })
            .catch((err) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });
    it("Should fail removing dataset: invalid ID (null)", function () {
        const id: string = null;
        return insightFacade
            .removeDataset(id)
            .then((result: string) => {
                expect.fail(result, InsightError, "Should have failed");
            })
            .catch((err) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });
    it("Should fail removing dataset: invalid ID (undefined)", function () {
        const id: string = undefined;
        return insightFacade
            .removeDataset(id)
            .then((result: string) => {
                expect.fail(result, InsightError, "Should have failed");
            })
            .catch((err) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });
    it("Should succeed at adding, removing, and re-adding a dataset of the same ID", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        const expected2: string = "courses";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect(result).to.deep.equal(expected);
                insightFacade.removeDataset(id);
                insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
            })
            .catch((err: any) => {
                expect.fail(err, expected, "Should not have rejected");
            });
    });
    it("Should fail at adding same database to two different InsightFacades", function () {
        const id: string = "courses";
        let facade: InsightFacade;
        const expected: string[] = [id];
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect(result).to.deep.equal(expected);
                facade = new InsightFacade();
                facade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
                    .then((results: string[]) => {
                        expect(results).to.deep.equal(expected);
                    }).catch((err) => {
                        expect(err).to.be.instanceof(InsightError);
                });
            })
            .catch((err) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });
    it("Should succeed at listing dataset (courses)", function () {
        const id: string = "courses";
        const expect1: string[] = [id];
        const dataset: InsightDataset =
            {id: "courses", kind: InsightDatasetKind.Courses, numRows: 64612} as InsightDataset;
        const expected: InsightDataset[] = [dataset];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((res: string[]) => {
                expect(res).to.deep.equal(expect1);
                insightFacade
                    .listDatasets()
                    .then((result: InsightDataset[]) => {
                        expect(result).to.deep.equal(expected);
                    })
                    .catch ((err: any) => {
                        expect.fail(err, expected, "Should not have rejected");
                    });
            }).catch((err: any) => {
                expect.fail(err, expected, "Should not have rejected");
            });
    });
    it("Should succeed at listing dataset (rooms)", function () {
        const id: string = "rooms";
        const expect1: string[] = [id];
        const dataset: InsightDataset =
            {id: "rooms", kind: InsightDatasetKind.Rooms, numRows: 364} as InsightDataset;
        const expected: InsightDataset[] = [dataset];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms)
            .then((res: string[]) => {
                expect(res).to.deep.equal(expect1);
                insightFacade
                    .listDatasets()
                    .then((result: InsightDataset[]) => {
                        expect(result).to.deep.equal(expected);
                    })
                    .catch ((err: any) => {
                        expect.fail(err, expected, "Should not have rejected");
                    });
            }).catch((err: any) => {
                expect.fail(err, expected, "Should not have rejected");
            });
    });
    it("Should succeed at listing multiple datasets", function () {
        const id: string = "courses";
        const id2: string = "courses copy";
        const expect1: string[] = [id];
        const expect2: string[] = [id, id2];
        const dataset: InsightDataset =
            {id: "courses", kind: InsightDatasetKind.Courses, numRows: 64612} as InsightDataset;
        const dataset2: InsightDataset =
            {id: "courses copy", kind: InsightDatasetKind.Courses, numRows: 64612} as InsightDataset;
        const expected: InsightDataset[] = [dataset, dataset2];
        let a = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        let b = insightFacade.addDataset(id2, datasets[id], InsightDatasetKind.Courses);
        return Promise.all([a, b])
            .then(([resultA, resultB]) => {
                expect(resultA).to.deep.equal(expect1);
                expect(resultB).to.deep.equal(expect2);
                return insightFacade.listDatasets();
            })
            .then((result: InsightDataset[]) => {
                expect(result).to.deep.equal(expected);
            })
            .catch((err: any) => {
                expect.fail(err, expected, "Should not have rejected");
            });
    });
    it("Should succeed at listing multiple datasets (room + course)", function () {
        const id: string = "courses";
        const id2: string = "rooms";
        const expect1: string[] = [id];
        const expect2: string[] = [id, id2];
        const dataset: InsightDataset =
            {id: "courses", kind: InsightDatasetKind.Courses, numRows: 64612} as InsightDataset;
        const dataset2: InsightDataset =
            {id: "rooms", kind: InsightDatasetKind.Rooms, numRows: 364} as InsightDataset;
        const expected: InsightDataset[] = [dataset, dataset2];
        let a = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        let b = insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Rooms);
        return Promise.all([a, b])
            .then(([resultA, resultB]) => {
                expect(resultA).to.deep.equal(expect1);
                expect(resultB).to.deep.equal(expect2);
                return insightFacade.listDatasets();
            })
            .then((result: InsightDataset[]) => {
                expect(result).to.deep.equal(expected);
            })
            .catch((err: any) => {
                expect.fail(err, expected, "Should not have rejected");
            });
    });
    it("Should succeed at listing no datasets", function () {
        const expected: InsightDataset[] = [];
        return insightFacade
            .listDatasets()
            .then((result: InsightDataset[]) => {
                expect(result).to.deep.equal(expected);
            })
            .catch((err: any) => {
                expect.fail(err, expected, "Should not have rejected");
            });
    });

    // test with bad id dataset
    it("Should fail to remove  bad id", function () {
        const id: string = "        ";
        const expected: string[] = [id];
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail(result, expected, "should have rejected");
        }).catch(function (err: InsightError) {
            expect(err);
        });
    });

    // test with bad id dataset
    it("Should fail to remove underscore id", function () {
        const id: string = " courses _   such   ";
        const expected: string[] = [id];
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail(result, expected, "should have rejected");
        }).catch(function (err: InsightError) {
            expect(err);
        });
    });


    // test with invalid dataset
    it("Should fail to add invalid Dataset", function () {
        const id: string = "invalidType";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "should have rejected");
        }).catch(function (err: InsightError) {
            expect(err);

        });
    });

    it("Should fail to add null string", function () {
        const id: string = "null";
        const expected: string[] = [id];
        return insightFacade.addDataset(null, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "should have rejected");
        }).catch(function (err: InsightError) {
            expect(err);

        });
    });

    it("Should fail to remove null string Dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.removeDataset(null).then((result: string) => {
            expect.fail(result, expected, "should have rejected");
        }).catch(function (err: InsightError) {
            expect(err);
        });
    });

    // Test of listing added dataset
    it("Should add then list", function () {
        const id: string = "courses";
        const expected: InsightDataset[] = [{id: "courses", kind: InsightDatasetKind.Courses, numRows: 64612}];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((res: string[]) => {
            Log.trace("about to list");
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
    });*/
});


/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: { [id: string]: { path: string, kind: InsightDatasetKind } } = {
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

    // Dynamically create and run a test for each query in testQueries.
// Creates an extra "test" called "Should run test queries" as a byproduct.
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function (done) {
                    const resultChecker = TestUtil.getQueryChecker(test, done);
                    insightFacade.performQuery(test.query)
                        .then(resultChecker)
                        .catch(resultChecker);
                });
            }
        });
    });


/*

   it("single query test", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.performQuery( {
                "WHERE": {
                    "IS": {
                        "courses_instructor": ""
                    }
                },
                "OPTIONS": {
                    "COLUMNS": [
                        "courses_dept",
                        "courses_avg"
                    ],
                    "ORDER": "courses_avg"
                }
            }
        ).then((result: []) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            Log.trace(err);
            expect.fail(err, expected, "Should not have rejected");
        });
    });
*/


});


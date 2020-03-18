import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;
import {expect} from "chai";
import * as fs from "fs";
import Log from "../src/Util";
import {InsightDatasetKind} from "../src/controller/IInsightFacade";

describe("Facade D3", function () {

    let facade: InsightFacade = null;
    let server: Server = null;
    let courses = fs.readFileSync("test/data/courses.zip");
    let rooms = fs.readFileSync("test/data/rooms.zip");
    let invalid = fs.readFileSync("test/data/Invalid.zip");
    let host: string = "http://localhost:4321";

    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade();
        server = new Server(4321);
        // TODO: start server here once and handle errors properly
        return server.start()
            .then(() => {
                Log.trace("Server started");
            })
            .catch(() => {
                Log.trace("Server start failed");
            });
    });

    after(function () {
        // TODO: stop server here once!
        return server.stop()
            .then(() => {
                Log.trace("Server stopped");
            })
            .catch(() => {
                Log.trace("Server failed to stop");
            });
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    it("PUT courses - valid", () => {
       try {
           return chai.request(host)
               .put("/dataset/courses/courses")
               .send(courses)
               .set("Content-Type", "application/x-zip-compressed")
               .then((res: Response) => {
                   Log.trace("PUTting courses successful");
                   expect(res.status).to.be.equal(200);
               });
       } catch (err) {
           Log.trace(err);
           expect.fail();
       }
    });

    it("PUT courses - invalid (invalid)", () => {
        try {
            return chai.request(host)
                .put("/dataset/courses/courses")
                .send(invalid)
                .set("Content-Type", "application/x-zip-compressed")
                .then((res: Response) => {
                    expect.fail();
                })
                .catch((err) => {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace(err);
            expect.fail();
        }
    });

    it("PUT courses - invalid (destination)", () => {
        try {
            return chai.request(host)
                .put("/dataset/cou_rses/courses")
                .send(courses)
                .set("Content-Type", "application/x-zip-compressed")
                .then((res: Response) => {
                    Log.trace(res.body);
                    expect.fail();
                })
                .catch((err) => {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace(err);
            expect.fail();
        }
    });

    it("GET courses - valid", () => {
       const expected = [{id: "courses", kind: InsightDatasetKind.Courses, numRoms: 64612}];
       try {
           return chai.request(host)
               .get("/datasets")
               .then((res: Response) => {
                   Log.trace("GET successful");
                   expect(res.status).to.be.equal(200);
                   Log.trace(res.body);
                   expect(res.body).to.deep.equal({result: expected});
               })
               .catch((err) => {
                   expect.fail(err);
               });
       } catch (err) {
           Log.trace(err);
           expect.fail();
       }
    });

    it("PUT courses - invalid (repeat dataset)", () => {
        try {
            return chai.request(host)
                .put("/dataset/courses/courses")
                .send(courses)
                .set("Content-Type", "application/x-zip/compressed")
                .then((res: Response) => {
                    Log.trace("PUT failed, this dataset has already added");
                    expect.fail();
                })
                .catch((err) => {
                    expect(err.status).to.be.equal(400);
            });
        } catch (err) {
            Log.trace(err);
        }
    });

    it("POST courses - valid", () => {
        let sample: any = {
            WHERE: {
                GT: {
                    courses_avg: 99
                }
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_dept",
                    "courses_avg"
                ],
                ORDER: "courses_avg"
            }
        };
        let result: any = {
            result: [
                {courses_dept: "cnps", courses_avg: 99.19},
                {courses_dept: "math", courses_avg: 99.78},
                {courses_dept: "math", courses_avg: 99.78}]
        };
        try {
            return chai.request(host)
                .post("/query")
                .send(sample)
                .then((res: Response) => {
                    Log.trace("POST successful");
                    expect(res.body).to.deep.equal(result);
                    expect(res.status).to.be.equal(200);
                })
                .catch((err) => {
                    expect.fail(err);
                });
        } catch (err) {
            Log.trace(err);
            expect.fail();
        }
    });

    it("DEL courses - valid", () => {
        try {
            return chai.request(host)
                .del("/dataset/courses")
                .then((res: Response) => {
                    Log.trace("DELeting courses successful");
                    expect(res.status).to.be.equal(200);
                })
                .catch((err) => {
                    expect.fail(err);
                });
        } catch (err) {
            Log.trace(err);
            expect.fail();
        }
    });

    it("DEL courses - invalid (destination)", () => {
        try {
            return chai.request(host)
                .del("/dataset/cour_ses")
                .then((res: Response) => {
                    expect.fail();
                })
                .catch((err) => {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace(err);
        }
    });

    it("DEL courses - invalid (repeat", () => {
        try {
            return chai.request(host)
                .del("/dataset/courses")
                .then((res: Response) => {
                    expect.fail();
                })
                .catch((err) => {
                    expect(err.status).to.be.equal(404);
                });
        } catch (err) {
            Log.trace(err);
        }
    });

    it("PUT rooms - valid", () => {
        try {
            return chai.request(host)
                .put("/dataset/rooms/rooms")
                .send(rooms)
                .set("Content-Type", "application/x-zip-compressed")
                .then((res: Response) => {
                    Log.trace("PUTting rooms successful");
                    expect(res.status).to.be.equal(200);
                })
                .catch((err) => {
                    expect.fail();
                });
        } catch (err) {
            Log.trace(err);
            expect.fail();
        }
    });

    it("GET rooms - valid", () => {
        const expected = [{id: "rooms", kind: InsightDatasetKind.Rooms, numRows: 364}];
        try {
            return chai.request(host)
                .get("/datasets")
                .then((res: Response) => {
                    Log.trace("GETtin rooms successful");
                    expect(res.status).to.be.equal(200);
                    expect(res.body).to.be.deep.equal({result: expected});
                })
                .catch((err) => {
                    Log.trace(err);
                    expect.fail(err);
                });
        } catch (err) {
            Log.trace(err);
            expect.fail();
        }
    });
    // Sample on how to format PUT requests
    /*
    it("PUT test for courses dataset", function () {
        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    expect(res.status).to.be.equal(204);
                })
                .catch(function (err) {
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
        }
    });
    */

    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});

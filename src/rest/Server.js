"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const restify = require("restify");
const Util_1 = require("../Util");
const InsightFacade_1 = require("../controller/InsightFacade");
const IInsightFacade_1 = require("../controller/IInsightFacade");
class Server {
    constructor(port) {
        Util_1.default.info("Server::<init>( " + port + " )");
        this.port = port;
    }
    stop() {
        Util_1.default.info("Server::close()");
        const that = this;
        return new Promise(function (fulfill) {
            that.rest.close(function () {
                fulfill(true);
            });
        });
    }
    start() {
        const that = this;
        return new Promise(function (fulfill, reject) {
            try {
                Util_1.default.info("Server::start() - start");
                that.rest = restify.createServer({
                    name: "insightUBC",
                });
                that.rest.use(restify.bodyParser({ mapFiles: true, mapParams: true }));
                that.rest.use(function crossOrigin(req, res, next) {
                    res.header("Access-Control-Allow-Origin", "*");
                    res.header("Access-Control-Allow-Headers", "X-Requested-With");
                    return next();
                });
                that.rest.get("/echo/:msg", Server.echo);
                that.rest.put("/dataset/:id/:kind", Server.putter);
                that.rest.del("/dataset/:id", Server.deleter);
                that.rest.post("/query", Server.poster);
                that.rest.get("/datasets", Server.getter);
                that.rest.get("/.*", Server.getStatic);
                that.rest.listen(that.port, function () {
                    Util_1.default.info("Server::start() - restify listening: " + that.rest.url);
                    fulfill(true);
                });
                that.rest.on("error", function (err) {
                    Util_1.default.info("Server::start() - restify ERROR: " + err);
                    reject(err);
                });
            }
            catch (err) {
                Util_1.default.error("Server::start() - ERROR: " + err);
                reject(err);
            }
        });
    }
    static putter(req, res, next) {
        let id = req.params.id;
        let kind = req.params.kind;
        let content = req.body.toString("base64");
        Server.insightFacade.addDataset(id, content, kind)
            .then((response) => {
            res.json(200, { result: response });
        })
            .catch((err) => {
            res.json(400, { error: "AddDataset rejected" });
        });
        return next;
    }
    static deleter(req, res, next) {
        let id = req.params.id;
        Server.insightFacade.removeDataset(id)
            .then((response) => {
            res.json(200, { result: response });
        })
            .catch((err) => {
            if (err instanceof IInsightFacade_1.NotFoundError) {
                res.json(404, { error: "RemoveDataset rejected with NotFoundError" });
            }
            else {
                res.json(400, { error: "RemoveDataset rejected with InsightError" });
            }
        });
        return next();
    }
    static poster(req, res, next) {
        let query = req.params;
        Server.insightFacade.performQuery(query)
            .then((response) => {
            res.json(200, { result: response });
        })
            .catch((err) => {
            res.json(400, { error: "PerformQuery rejected" });
        });
        return next();
    }
    static getter(req, res, next) {
        Server.insightFacade.listDatasets()
            .then((response) => {
            res.json(200, { result: response });
        });
        return next();
    }
    static echo(req, res, next) {
        Util_1.default.trace("Server::echo(..) - params: " + JSON.stringify(req.params));
        try {
            const response = Server.performEcho(req.params.msg);
            Util_1.default.info("Server::echo(..) - responding " + 200);
            res.json(200, { result: response });
        }
        catch (err) {
            Util_1.default.error("Server::echo(..) - responding 400");
            res.json(400, { error: err });
        }
        return next();
    }
    static performEcho(msg) {
        if (typeof msg !== "undefined" && msg !== null) {
            return `${msg}...${msg}`;
        }
        else {
            return "Message not provided";
        }
    }
    static getStatic(req, res, next) {
        const publicDir = "frontend/public/";
        Util_1.default.trace("RoutHandler::getStatic::" + req.url);
        let path = publicDir + "index.html";
        if (req.url !== "/") {
            path = publicDir + req.url.split("/").pop();
        }
        fs.readFile(path, function (err, file) {
            if (err) {
                res.send(500);
                Util_1.default.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }
}
exports.default = Server;
Server.insightFacade = new InsightFacade_1.default();
//# sourceMappingURL=Server.js.map
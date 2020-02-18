"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("./IInsightFacade");
class Course {
    constructor() {
        this.dept = null;
        this.id = "";
        this.avg = 0;
        this.instructor = "";
        this.title = "";
        this.pass = 0;
        this.fail = 0;
        this.audit = 0;
        this.uuid = "";
        this.year = 1900;
    }
}
exports.Course = Course;
function readCourseData(data) {
    let courses = [];
    for (let i = 1; i < data.length; i++) {
        let d = data[i];
        try {
            let file = JSON.parse(d);
            if (file.result.length === 0) {
                continue;
            }
            else if (!file.hasOwnProperty("result")) {
                throw new IInsightFacade_1.InsightError("Invalid file found");
            }
            else {
                for (let f of file.result) {
                    let course = generateCourse(f);
                    courses.push(course);
                }
            }
        }
        catch (e) {
            throw new IInsightFacade_1.InsightError(e);
        }
    }
    return courses;
}
exports.readCourseData = readCourseData;
function generateCourse(file) {
    let course = new Course();
    try {
        course.dept = file.Subject;
        course.id = file.Course;
        course.avg = file.Avg;
        course.instructor = file.Professor;
        course.title = file.Title;
        course.pass = file.Pass;
        course.fail = file.Fail;
        course.audit = file.Audit;
        course.uuid = file.id.toString();
        if (file.Section !== "overall") {
            course.year = Number(file.Year);
        }
    }
    catch (e) {
        throw new IInsightFacade_1.InsightError();
    }
    return course;
}
exports.generateCourse = generateCourse;
//# sourceMappingURL=Course.js.map
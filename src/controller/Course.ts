import {InsightError} from "./IInsightFacade";

export class Course {
    public dept: string;
    public id: string;
    public avg: number;
    public instructor: string;
    public title: string;
    public pass: number;
    public fail: number;
    public audit: number;
    public uuid: string;
    public year: number;

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

export function readCourseData(data: any[]): Course[] {
    let courses: Course[] = [];
    for (let i = 1; i < data.length; i++) {
        let d = data[i];
        try {
            let file = JSON.parse(d);
            if (file.result.length === 0) {
                continue;
            } else if (!file.hasOwnProperty("result")) {
                throw new InsightError("Invalid file found");
            } else {
                for (let f of file.result) {
                    let course: Course = generateCourse(f);
                    courses.push(course);
                }
            }
        } catch (e) {
            throw new InsightError(e);
        }
    }
    return courses;
}

export function generateCourse(file: any): Course {
    let course: Course = new Course();
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
    } catch (e) {
        throw new InsightError();
    }
    return course;
}

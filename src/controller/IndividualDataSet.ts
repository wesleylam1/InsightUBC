import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";

export class IndividualDataSet {
    private dept: string;
    private id: string;
    private avg: number;
    private instructor: string;
    private title: string;
    private pass: number;
    private fail: number;
    private audit: number;
    private uuid: string;
    private year: number;


    public getDept(): string {
        return this.dept;
    }

    public getID(): string {
        return this.id;
    }

    public getAvg(): number {
        return this.avg;
    }

    public getInstructor(): string {
        return this.instructor;
    }

    public getTitle(): string {
        return this.title;
    }

    public getPass(): number {
        return this.pass;
    }

    public getFail(): number {
        return this.fail;
    }

    public getAudit(): number {
        return this.audit;
    }

    public getUUID(): string {
        return this.uuid;
    }

    public getYear(): number {
        return this.year;
    }

    public setDept(dept: string): void {
         this.dept = dept;
    }

    public setID(id: string): void {
         this.id = id;
    }

    public setAvg(avg: number): void {
         this.avg = avg;
    }

    public setInstructor(instructor: string): void {
         this.instructor = instructor;
    }

    public setTitle(title: string): void {
         this.title = title;
    }

    public setPass(pass: number): void {
         this.pass = pass;
    }

    public setFail(fail: number): void {
        this.fail = fail;
    }

    public setAudit(audit: number): void {
        this.audit = audit;
    }

    public setUUID(uuid: string): void {
        this.uuid = uuid;
    }

    public setYear(year: number): void {
        this.year = year;
    }

    constructor(dept: string, id: string, avg: number, instructor: string,
                title: string, pass: number, fail: number, audit: number,
                uuid: string, year: number) {
        this.dept = dept;
        this.id = id;
        this.avg = avg;
        this.instructor = instructor;
        this.title = title;
        this.pass = pass;
        this.fail = fail;
        this.audit = audit;
        this.uuid = uuid;
        this.year = year;
    }

}

import QueryController from "./QueryController";


export default class TransformationProcessor {

    private controller: QueryController;

    constructor(controller: QueryController) {
        this.controller = controller;
    }

    public processTransformations(transformations: any): any {

        return [];
    }
}

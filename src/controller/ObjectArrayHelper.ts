
export default class ObjectArrayHelper {


    public mergeResults(arr1: any[], arr2: any[]): any[] {
        let union = arr1.concat(arr2);
        for (let i = 0; i < union.length; i++) {
            for (let j = i + 1; j < union.length; j++) {
                if (this.checkEquality (union[i], union[j])) {
                    union.splice(j, 1);
                    j--;
                }
            }
        }
        return union;
    }

    public arrayHasSection(array: any[], targetSection: any): boolean {
        for (let section of array) {
            if (this.checkEquality(section, targetSection)) {
                return true;
            }
        }
        return false;
    }

    public excludeSections(itemsToExclude: any[], sections: any[]): any {
        let result = sections;
        for (let section of result) {
            if (this.arrayHasSection(itemsToExclude, section)) {
                result.splice( result.indexOf(section), 1 );
            }
        }
        return result;
    }

    public getSharedResults(array: any[]): any {
        let result: any[] = [];
        result = array[0];
        for (let i of array) {
            for (let section of result) {
                if (!(this.arrayHasSection(i, section))) {
                    result.splice( result.indexOf(section), 1 );
                }
            }
        }
        return result;
    }

    public checkEquality(a: any, b: any): boolean {
        let aProps = Object.getOwnPropertyNames(a);
        let bProps = Object.getOwnPropertyNames(b);
        if (aProps.length !== bProps.length) {
            return false;
        }
        for (let i in aProps) {
            let propName = aProps[i];
            if (a[propName] !== b[propName]) {
                return false;
            }
        }
        return true;
    }
}

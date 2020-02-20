
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
        let prev: any[] = array[0];
        for (let i = 1; i < array.length; i++) {
            result = this.getSharedSections(prev, array[i]);
            prev = result;
        }
        return result;
    }

    private getSharedSections(array1: any[], array2: any[]) {
        let result: any[] = [];
        for (let i of array2) {
            if (this.arrayHasSection(array1, i) && !this.arrayHasSection(result, i)) {
                result.push(i);
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

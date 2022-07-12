import { ICrudioFilter } from "./CrudioTypes";
export default class CrudioFilter implements ICrudioFilter {
    fieldName: string;
    filterValue: string;
    filterType: string;
    constructor(fieldName: string, filterType: string, filterValue: string);
}

import { ICrudioField, ICrudioFieldOptions } from "./CrudioTypes";
export default class CrudioField implements ICrudioField {
    fieldName: string;
    caption?: string;
    fieldType: string;
    defaultValue?: any;
    fieldOptions: ICrudioFieldOptions;
    constructor(fieldName: string, fieldType: string, caption?: string, options?: ICrudioFieldOptions);
    GetCaption(): string;
    get GetDatabaseFieldType(): string;
}

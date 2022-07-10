import { ICrudioField, ICrudioInclude, ICrudioEntityType } from "./CrudioTypes";
import CrudioEntityType from "./CrudioEntityType";
import CrudioField from "./CrudioField";

export default class CrudioInclude implements ICrudioInclude {
    entity: CrudioEntityType;
    fields: CrudioField[];
    entityName: string;

    constructor(entity: CrudioEntityType, entityName: string, fields: CrudioField[]) {
        this.entity = entity;
        this.fields = fields;
        this.entityName = entityName;
    }
}
